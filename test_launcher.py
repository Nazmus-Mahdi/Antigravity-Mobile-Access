import pytest
from unittest.mock import patch, MagicMock
from launcher import get_local_ip

def test_get_local_ip_success():
    with patch('socket.socket') as mock_socket_class:
        mock_socket_instance = MagicMock()
        mock_socket_class.return_value = mock_socket_instance
        mock_socket_instance.getsockname.return_value = ('192.168.1.100', 12345)

        ip = get_local_ip()

        assert ip == '192.168.1.100'
        mock_socket_class.assert_called_once()
        mock_socket_instance.connect.assert_called_once_with(('8.8.8.8', 80))
        mock_socket_instance.getsockname.assert_called_once()
        mock_socket_instance.close.assert_called_once()

def test_get_local_ip_socket_creation_failure():
    with patch('socket.socket', side_effect=Exception("Failed to create socket")):
        ip = get_local_ip()

        assert ip == '127.0.0.1'

def test_get_local_ip_connect_failure():
    with patch('socket.socket') as mock_socket_class:
        mock_socket_instance = MagicMock()
        mock_socket_class.return_value = mock_socket_instance
        mock_socket_instance.connect.side_effect = Exception("Failed to connect")

        ip = get_local_ip()

        assert ip == '127.0.0.1'
        mock_socket_instance.connect.assert_called_once()
        mock_socket_instance.close.assert_called_once()

def test_get_local_ip_getsockname_failure():
    with patch('socket.socket') as mock_socket_class:
        mock_socket_instance = MagicMock()
        mock_socket_class.return_value = mock_socket_instance
        mock_socket_instance.getsockname.side_effect = Exception("Failed to get sock name")

        ip = get_local_ip()

        assert ip == '127.0.0.1'
        mock_socket_instance.connect.assert_called_once()
        mock_socket_instance.getsockname.assert_called_once()
        mock_socket_instance.close.assert_called_once()
