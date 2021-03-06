#!/bin/bash
#
# timeout [-SIG] [time] [--] command args...
#
# Run the given command until completion, but kill it if it runs too long.
# Specifically designed to exit immediatally (no sleep interval) and clean up
# nicely without messages or leaving any extra processes when finished.
#
# Example use
#    timeout 5 countdown
#
###
#
# Based on notes in my "Shell Script Hints", section "Command Timeout"
#   http://www.ict.griffith.edu.au/~anthony/info/shell/script.hints
#
# This script uses a lot of tricks to terminate both the background command,
# the timeout script, and even the sleep process.  It also includes trap
# commands to prevent sub-shells reporting expected "Termination Errors".
#
# It took years of occasional trials, errors and testing to get a pure bash
# timeout command working as well as this does.
#
###
#
# Anthony Thyssen     6 April 2011
#
PROGNAME=`type $0 | awk '{print $3}'`  # search for executable on path
PROGDIR=`dirname $PROGNAME`            # extract directory of program
PROGNAME=`basename $PROGNAME`          # base name of program
Usage() {                              # output the script comments as docs
  echo >&2 "$PROGNAME:" "$@"
    sed >&2 -n '/^###/q; /^#/!q; s/^#//; s/^ //; 3s/^/Usage: /; 2,$ p' \
            "$PROGDIR/$PROGNAME"
  exit 10;
}

# if a binary timeout has been provided use it instead
if [ -x /bin/timeout ]; then
  exec /bin/timeout "$@"
fi

SIG=-TERM
TIMEOUT=10  # default timeout

while [  $# -gt 0 ]; do
  case "$1" in
  --)     shift; break ;;    # forced end of user options
  -\?|--help|--doc*) Usage ;;
  [0-9]*) TIMEOUT="$1" ;;
  -*)     SIG="$1" ;;
  *)      break ;;           # unforced  end of user options
  esac
shift   # next option
done


#-------------------------------------------------------------------------
# run subroutine in backgrouds and get its pid
"$@" &
command_pid=$!
#echo "timeout: commmand running as PID $command_pid"

# timeout sub-process abort countdown after TIMEOUT seconds! 
# NOTE sleep does not die on some machines without a -9!
# Also it sometimes fails to launch at random on others (RH5?)
( #trap 'kill -9 $sleep_pid; exit 1' 1 2 3 15  # cleanup sleep process
  sleep $TIMEOUT &             # sleep timeout period
  sleep_pid=$!
  if [ "$sleep_pid" ]; then
    wait $sleep_pid 2>/dev/null
    echo >&2 "timeout: TIMED OUT after $TIMEOUT seconds, sending $SIG ... "
    kill $SIG $command_pid 2>/dev/null   # Abort the command
    kill -9 $sleep_pid 2>/dev/null       # if sleep is running
  else
    echo >&2 "timeout: sleep failure"
  fi
  exit 1
) &
timeout_pid=$!

# Wait for main command to finish or be killed by the timeout
wait $command_pid 2>/dev/null
status=$?
#echo "timeout: commmand exit status $status"

# Clean up timeout sub-shell - if it is still running!
kill $timeout_pid 2>/dev/null
wait $timeout_pid 2>/dev/null

# Uncomment to check if a LONG sleep still running (no sleep should be)
#{ sleep 1
#  echo "-----------"
#  /bin/ps j  # uncomment to show if abort "sleep" is still sleeping
#} >&2
#echo "DONE" >&2

# Note in some cases the shell will hang on exit, if the sleep did not die!
exit $status
