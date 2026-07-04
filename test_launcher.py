import sys
import subprocess
import pytest
from unittest.mock import patch

import launcher

def test_check_node_environment_missing_node(capsys):
    """Test that missing Node.js exits the program and prints an error."""
    with patch('subprocess.check_call') as mock_check_call, \
         patch('sys.exit') as mock_exit:

        # Simulate FileNotFoundError when checking node --version
        mock_check_call.side_effect = FileNotFoundError("No such file or directory")
        mock_exit.side_effect = SystemExit(1)

        with pytest.raises(SystemExit) as e:
            launcher.check_node_environment()

        assert e.value.code == 1

        # Check that it tried to call node --version
        mock_check_call.assert_called_once_with(
            ["node", "--version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        # Check that sys.exit was called with 1
        mock_exit.assert_called_once_with(1)

        # Check output
        captured = capsys.readouterr()
        assert "[ERROR] Error: Node.js is not installed. Please install it from https://nodejs.org/" in captured.out
