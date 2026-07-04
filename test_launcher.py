import pytest
import sys
import subprocess
from unittest.mock import patch

import launcher

def test_check_dependencies_all_installed(capsys):
    """Test when all dependencies are installed."""
    # Simulate all dependencies are installed by letting imports work
    # (since this is a unit test, we might not have all, but let's assume builtins.__import__ works
    # Actually, it's safer to just patch sys.modules to simulate they are installed if they aren't,
    # or just let it pass if they are.
    # To properly simulate installed, we can mock sys.modules
    with patch.dict('sys.modules', {'pyngrok': True, 'dotenv': True, 'qrcode': True, 'pinggy': True}):
        # Also need to patch __import__ because from ... import ... uses __import__ internally
        # and checking sys.modules is not enough to bypass ImportError if the module doesn't exist
        # However, the code uses:
        # if pkg == "pyngrok": from pyngrok import ngrok
        # The best way to make this pass is to mock __import__ to just return a MagicMock or not raise
        with patch('builtins.__import__'):
            launcher.check_dependencies()

    captured = capsys.readouterr()
    assert "[PKG] Installing missing dependencies" not in captured.out

def test_check_dependencies_missing_success(capsys):
    """Test when dependencies are missing and installed successfully."""
    # We want to simulate missing modules.
    # Using sys.modules is not enough as `import foo` still triggers builtins.__import__ and raises if it's missing on disk.
    # To explicitly raise ImportError for these specific modules, we can use patch on builtins.__import__
    # as done before, or patch.dict('sys.modules', {'pyngrok': None, 'dotenv': None, 'qrcode': None, 'pinggy': None})
    # Setting them to None in sys.modules officially tells Python the module doesn't exist.

    with patch.dict('sys.modules', {'pyngrok': None, 'dotenv': None, 'qrcode': None, 'pinggy': None}):
        with patch('subprocess.check_call') as mock_check_call:
            launcher.check_dependencies()

            mock_check_call.assert_called_once_with(
                [sys.executable, "-m", "pip", "install", "pyngrok", "python-dotenv", "qrcode", "pinggy"]
            )
    captured = capsys.readouterr()
    assert "[PKG] Installing missing dependencies: pyngrok, python-dotenv, qrcode, pinggy..." in captured.out
    assert "[OK] Dependencies installed." in captured.out

def test_check_dependencies_missing_failure(capsys):
    """Test when dependencies are missing and installation fails."""
    with patch.dict('sys.modules', {'pyngrok': None, 'dotenv': None, 'qrcode': None, 'pinggy': None}):
        # Mocking check_call to raise CalledProcessError
        with patch('subprocess.check_call', side_effect=subprocess.CalledProcessError(1, 'pip')):
            with pytest.raises(SystemExit) as e:
                launcher.check_dependencies()

            assert e.value.code == 1
    captured = capsys.readouterr()
    assert "[ERROR] Failed to install dependencies" in captured.out
