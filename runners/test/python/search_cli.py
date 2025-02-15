import os
import argparse
import multiprocessing as mp
import subprocess as subp
import json
import hashlib
import pathlib
import shlex
from mlir.dialects import linalg
from compilation import scalar_types, compile_and_callback
from search import collect_variables, instantiate_variables
import experts


def parse_args():
  parser = argparse.ArgumentParser(description='Command-line directed search.')
  parser.add_argument(
      '--op',
      type=str,
      default='matmul',
      help='Name of the linalg op to instantiate.')
  parser.add_argument(
      '--types',
      type=str,
      default='f32',
      help='Comma-separated list of scalar types.')
  parser.add_argument(
      '--dim_range',
      type=str,
      default='8,1025,8',
      help='Range of potential dimension values.')
  parser.add_argument(
      '--int_range',
      type=str,
      default='128,1025,128',
      help='Range of potential int values.')
  parser.add_argument(
      '--tsize_length_range',
      type=str,
      default='0,4,1',
      help='Range of potential lengths for tiling sizes.')
  parser.add_argument(
      '--tsize_value_range',
      type=str,
      default='8,513,8',
      help='Range of potential values for tiling sizes.')
  parser.add_argument(
      '--hpad_range',
      type=str,
      default='0,3',
      help='Range of potential values for hoist padding.')
  parser.add_argument(
      '--expert',
      type=str,
      default='ExpertCompiler1',
      help='Name of the expert to use for compilation.')
  parser.add_argument(
      '--samples',
      type=int,
      default=100,
      help='Number of samples to collect in each search process.')
  parser.add_argument(
      '--timeout',
      type=int,
      default=1,
      help='Timeout for running a subprocess in seconds.')
  parser.add_argument(
      '--par',
      type=int,
      default=1,
      help='Number of search processes to run in parallel.')
  parser.add_argument(
      '--output',
      type=str,
      default='output',
      help='The output directory to accumulate search results.')
  parser.add_argument(
      '--assign',
      type=str,
      default=None,
      nargs='+',
      help='A sequence of K=V arguments to specify op or expert variables.')
  return parser.parse_args()


def validate_args(args):
  no_errors = True

  def error(msg):
    nonlocal no_errors
    no_errors = False
    print(msg)

  def validate_range(range_name):
    range_str = getattr(args, range_name)
    range_parts = range_str.split(',')
    if len(range_parts) < 1 or len(range_parts) > 3:
      error(
          f'{range_name} range should be defined using 1, 2 or 3 integer values.'
      )
    for part in range_parts:
      try:
        i = int(part)
      except:
        error(f'Failed to parse element in {range_name} range: {part}')
    range_parts = map(int, range_parts)
    value_range = range(*range_parts)
    if len(value_range) < 1:
      error(f'Must have at least one value in {range_name} range.')

  validate_range('int_range')
  validate_range('dim_range')
  validate_range('tsize_length_range')
  validate_range('tsize_value_range')
  validate_range('hpad_range')

  if not hasattr(linalg, args.op):
    error(f'Unknown op: {args.op}.')

  for type_name in args.types.split(','):
    if type_name not in scalar_types:
      error(f'Unknown type: {type_name}')

  if not hasattr(experts, args.expert):
    error(f'Unknown expert name: {args.expert}')

  if args.samples < 1:
    error('Search must collect at least one sample.')

  if args.timeout < 1:
    error('Timeout must be equal to 1 or larger.')

  if args.par < 1:
    error('Paralelism must be equal to 1 or larger.')

  return no_errors


def main():
  args = parse_args()
  if not validate_args(args):
    return

  if args.par > 1:
    for _ in range(args.par):
      p = mp.Process(target=search, args=(args,))
      p.start()
  else:
    search(args)


def parse_assignments(args):
  assignments = dict()
  assign_args = args.assign if args.assign is not None else []
  for assign in assign_args:
    name, rhs = assign.split('=')
    assignments[name] = json.loads(rhs)
  return assignments


def parse_range(range_str):
  str_parts = range_str.split(',')
  int_parts = map(int, str_parts)
  return range(*int_parts)


def parse_settings(args):
  settings = dict()
  settings['types'] = args.types.split(',')
  settings['int_range'] = parse_range(args.int_range)
  settings['dim_range'] = parse_range(args.dim_range)
  settings['tsize_length_range'] = parse_range(args.tsize_length_range)
  settings['tsize_value_range'] = parse_range(args.tsize_value_range)
  settings['hpad_range'] = parse_range(args.hpad_range)
  return settings


def search(args):
  op = getattr(linalg, args.op)
  expert = getattr(experts, args.expert)
  variables = collect_variables(op)
  variables.update(expert.variables)
  cli_assignments = parse_assignments(args)
  settings = parse_settings(args)

  for _ in range(args.samples):
    assignments = dict()
    assignments.update(instantiate_variables(variables, **settings))
    assignments.update(cli_assignments)
    invoke_subprocess(args.op, args.expert, assignments, args.output,
                      args.timeout)


def invoke_subprocess(op, expert, assignments, output_dir, timeout):
  file_dirname = os.path.dirname(__file__)
  invoke_cli = os.path.join(file_dirname, 'invoke_cli.py')
  command = ['python3', invoke_cli, '--op', op, '--expert', expert, '--assign']
  for k, v in assignments.items():
    command.append(f'{k}={json.dumps(v)}')

  def assignments_id():
    sorted_assignments = sorted(list(assignments.items()))
    key = json.dumps(sorted_assignments).encode(encoding='UTF-8')
    h = hashlib.new('sha256')
    h.update(key)
    return h.hexdigest()

  def ensure_exists(dir_path):
    path = pathlib.Path(dir_path)
    path.mkdir(parents=True, exist_ok=True)

  def persist(status, output):
    uniq_id = assignments_id()
    result_dir = os.path.join(output_dir, op, expert, status)
    ensure_exists(result_dir)
    command_file = os.path.join(result_dir, uniq_id + '.sh')
    command_str = ' '.join(map(shlex.quote, command))
    with open(command_file, 'w') as f:
      f.write(command_str)
    output_file = os.path.join(result_dir, uniq_id)
    with open(output_file, 'w') as f:
      f.write(output)
    print(f'[{status.upper()}] {command_str}')

  try:
    result = subp.run(
        command, timeout=1, stderr=subp.PIPE, stdout=subp.PIPE, check=True)
    persist('ok', result.stdout.decode('utf-8'))
  except subp.CalledProcessError as e:
    persist('fail', e.stderr.decode('utf-8'))
  except subp.TimeoutExpired as e:
    persist('timeout', '')


if __name__ == '__main__':
  main()
