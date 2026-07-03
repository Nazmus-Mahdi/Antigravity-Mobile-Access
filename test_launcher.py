import pytest
import string
from launcher import generate_passcode

def test_generate_passcode_length():
    """Test that the generated passcode is exactly 6 characters long."""
    passcode = generate_passcode()
    assert len(passcode) == 6

def test_generate_passcode_type():
    """Test that the generated passcode is a string."""
    passcode = generate_passcode()
    assert isinstance(passcode, str)

def test_generate_passcode_digits_only():
    """Test that all characters in the passcode are digits."""
    passcode = generate_passcode()
    for char in passcode:
        assert char in string.digits

    # Or simply:
    assert passcode.isdigit()

def test_generate_passcode_randomness():
    """Test that consecutive calls generate different passcodes (highly likely)."""
    # While technically possible to get the same passcode twice (1 in 1M),
    # generating a batch and checking for unique values is more robust.
    passcodes = [generate_passcode() for _ in range(100)]
    unique_passcodes = set(passcodes)
    # The chance of 100 identical passcodes is astronomically low.
    assert len(unique_passcodes) > 1
