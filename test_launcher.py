import pytest
from unittest.mock import patch, MagicMock
import launcher
import socket
import sys

def test_generate_passcode():
    passcode = launcher.generate_passcode()
    assert len(passcode) == 6
    assert passcode.isdigit()

def test_get_local_ip_success():
    with patch('socket.socket') as mock_socket:
        mock_sock_instance = MagicMock()
        mock_socket.return_value = mock_sock_instance
        mock_sock_instance.getsockname.return_value = ('192.168.1.10', 12345)

        ip = launcher.get_local_ip()

        assert ip == '192.168.1.10'
        mock_sock_instance.connect.assert_called_once_with(('8.8.8.8', 80))
        mock_sock_instance.close.assert_called_once()

def test_get_local_ip_failure():
    with patch('socket.socket') as mock_socket:
        mock_sock_instance = MagicMock()
        mock_socket.return_value = mock_sock_instance
        mock_sock_instance.connect.side_effect = Exception("Network error")

        ip = launcher.get_local_ip()

        assert ip == '127.0.0.1'
        mock_sock_instance.close.assert_called_once()

def test_print_qr():
    # The print_qr function tries to import qrcode locally.
    # We can mock sys.modules to mock qrcode
    mock_qrcode = MagicMock()
    mock_qrcode_class = MagicMock()
    mock_qr_instance = MagicMock()

    mock_qrcode.QRCode = mock_qrcode_class
    mock_qrcode_class.return_value = mock_qr_instance

    with patch.dict(sys.modules, {'qrcode': mock_qrcode}):
        launcher.print_qr("http://test.url")

        mock_qrcode_class.assert_called_once_with(version=1, box_size=1, border=1)
        mock_qr_instance.add_data.assert_called_once_with("http://test.url")
        mock_qr_instance.make.assert_called_once_with(fit=True)
        mock_qr_instance.print_ascii.assert_called_once_with(invert=True)

def test_check_dependencies_all_installed():
    # If all dependencies are installed, no pip install should happen
    mock_pyngrok = MagicMock()
    mock_dotenv = MagicMock()
    mock_qrcode = MagicMock()
    mock_pinggy = MagicMock()

    with patch.dict('sys.modules', {
        'pyngrok': mock_pyngrok,
        'dotenv': mock_dotenv,
        'qrcode': mock_qrcode,
        'pinggy': mock_pinggy
    }):
        with patch('subprocess.check_call') as mock_check_call:
            launcher.check_dependencies()
            mock_check_call.assert_not_called()

def test_check_dependencies_missing():
    # Simulate some dependencies missing
    # To do this safely, we will remove some from sys.modules
    with patch('subprocess.check_call') as mock_check_call:
        with patch.dict('sys.modules', {
            'pyngrok': None,
            'dotenv': None,
            'qrcode': None,
            'pinggy': None
        }):
            launcher.check_dependencies()
            # It should try to install all 4
            mock_check_call.assert_called_once_with(
                [sys.executable, "-m", "pip", "install", "pyngrok", "python-dotenv", "qrcode", "pinggy"]
            )

def test_check_dependencies_pip_fails():
    with patch('subprocess.check_call') as mock_check_call:
        with patch.dict('sys.modules', {
            'pyngrok': None,
            'dotenv': None,
            'qrcode': None,
            'pinggy': None
        }):
            mock_check_call.side_effect = Exception("pip failed")
            with patch('sys.exit') as mock_exit:
                mock_exit.side_effect = SystemExit(1)
                with pytest.raises(SystemExit):
                    launcher.check_dependencies()
                mock_exit.assert_called_once_with(1)

def test_check_node_environment_all_good():
    with patch('subprocess.check_call') as mock_check_call:
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = True # node_modules exists
            launcher.check_node_environment()

            # node --version is checked
            mock_check_call.assert_called_once_with(["node", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

import subprocess
def test_check_node_environment_no_node():
    with patch('subprocess.check_call') as mock_check_call:
        mock_check_call.side_effect = FileNotFoundError("node not found")
        with patch('sys.exit') as mock_exit:
            # sys.exit normally raises SystemExit, so we need to mock it to do so
            # otherwise the function continues running
            mock_exit.side_effect = SystemExit(1)
            with pytest.raises(SystemExit):
                launcher.check_node_environment()
            mock_exit.assert_called_once_with(1)

def test_check_node_environment_no_node_modules():
    with patch('subprocess.check_call') as mock_check_call:
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False # node_modules missing
            launcher.check_node_environment()

            # Should check node version, then run npm install
            assert mock_check_call.call_count == 2
            mock_check_call.assert_any_call(["node", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            mock_check_call.assert_any_call(["npm", "install"], shell=(sys.platform == "win32"))

def test_check_node_environment_npm_fails():
    with patch('subprocess.check_call') as mock_check_call:
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False # node_modules missing

            def check_call_side_effect(*args, **kwargs):
                if args[0] == ["npm", "install"]:
                    raise Exception("npm failed")
                return None

            mock_check_call.side_effect = check_call_side_effect

            with patch('sys.exit') as mock_exit:
                mock_exit.side_effect = SystemExit(1)
                with pytest.raises(SystemExit):
                    launcher.check_node_environment()
                mock_exit.assert_called_once_with(1)

import os

def test_main_local_mode(monkeypatch):
    mock_check_deps = MagicMock()
    mock_check_node = MagicMock()
    mock_dotenv = MagicMock()
    mock_ngrok = MagicMock()

    with patch.dict('sys.modules', {'pyngrok': MagicMock(ngrok=mock_ngrok), 'dotenv': mock_dotenv}):
        with patch('launcher.check_dependencies', mock_check_deps), \
             patch('launcher.check_node_environment', mock_check_node), \
             patch('sys.argv', ['launcher.py', '--mode', 'local']), \
             patch('os.path.exists', return_value=False), \
             patch('launcher.get_local_ip', return_value='192.168.1.10'), \
             patch('subprocess.Popen') as mock_popen, \
             patch('time.sleep', return_value=None), \
             patch('launcher.print_qr') as mock_print_qr:

            # Make the popen return a process that is "running" (poll returns None)
            mock_process = MagicMock()
            mock_process.poll.return_value = None
            mock_popen.return_value = mock_process

            # We also need to exit the keep-alive loop. Easiest way is KeyboardInterrupt
            mock_process.poll.side_effect = [None, KeyboardInterrupt()]

            launcher.main()

        mock_check_deps.assert_called_once()
        mock_check_node.assert_called_once()

        # Verify node process started
        mock_popen.assert_called_once()
        args, kwargs = mock_popen.call_args
        assert args[0] == ["node", "server.js"]

        # Verify QR printed for local IP
        mock_print_qr.assert_called_once()
        assert "http://192.168.1.10" in mock_print_qr.call_args[0][0]

def test_main_web_ngrok_mode(monkeypatch):
    mock_check_deps = MagicMock()
    mock_check_node = MagicMock()
    mock_ngrok = MagicMock()
    mock_dotenv = MagicMock()

    # Pre-set sys.modules for pyngrok so that we can mock it
    with patch.dict('sys.modules', {'pyngrok': MagicMock(ngrok=mock_ngrok), 'dotenv': mock_dotenv}):
        mock_tunnel = MagicMock()
        mock_tunnel.public_url = "https://mock-ngrok.url"
        mock_ngrok.connect.return_value = mock_tunnel

        with patch('launcher.check_dependencies', mock_check_deps), \
             patch('launcher.check_node_environment', mock_check_node), \
             patch('sys.argv', ['launcher.py', '--mode', 'web', '--provider', 'ngrok']), \
             patch('subprocess.Popen') as mock_popen, \
             patch('time.sleep', return_value=None), \
             patch('launcher.print_qr') as mock_print_qr:

            mock_process = MagicMock()
            # Intercept poll inside the keep-alive loop with KeyboardInterrupt
            mock_process.poll.side_effect = [None, KeyboardInterrupt()]
            mock_popen.return_value = mock_process

            launcher.main()

            mock_ngrok.connect.assert_called_once()

            mock_print_qr.assert_called_once()
            url_passed = mock_print_qr.call_args[0][0]
            assert url_passed.startswith("https://mock-ngrok.url")
            assert "key=" in url_passed
