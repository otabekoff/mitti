#!/usr/bin/env bash
# ==============================================================================
# Mitti Programming Language — One-Line Bash Installer for Linux & macOS
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/otabekoff/mitti/master/install.sh | bash
# ==============================================================================

set -e

REPO="otabekoff/mitti"
INSTALL_DIR="$HOME/.mitti/bin"

echo ""
echo "  __  __ _ _   _   _"
echo " |  \/  (_) |_| |_(_)"
echo " | |\/| | | __| __| |"
echo " | |  | | | |_| |_| |"
echo " |_|  |_|_|\__|\__|_|"
echo ""
echo " Mitti Programming Language Installer"
echo "========================================"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux*)
    TARGET="mitti-linux-x64"
    ;;
  Darwin*)
    TARGET="mitti-macos-x64"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

mkdir -p "$INSTALL_DIR"

URL="https://github.com/$REPO/releases/latest/download/${TARGET}.tar.gz"
echo "-> Downloading Mitti for $OS ($ARCH)..."

TMP_TAR=$(mktemp)
if ! curl -fSL "$URL" -o "$TMP_TAR"; then
    echo "-> Falling back to v1.0.0..."
    FALLBACK_URL="https://github.com/$REPO/releases/download/v1.0.0/${TARGET}.tar.gz"
    curl -fSL "$FALLBACK_URL" -o "$TMP_TAR"
fi

tar -xzf "$TMP_TAR" -C "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/mitti"
rm -f "$TMP_TAR"

# Shell configuration
PROFILE=""
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
    PROFILE="$HOME/.bashrc"
fi

if [ -n "$PROFILE" ]; then
    if ! grep -q 'MITTI_HOME' "$PROFILE" 2>/dev/null; then
        echo "" >> "$PROFILE"
        echo "# Mitti Programming Language" >> "$PROFILE"
        echo 'export PATH="$HOME/.mitti/bin:$PATH"' >> "$PROFILE"
        echo "-> Added to $PROFILE"
    fi
fi

echo ""
echo "========================================"
echo " Mitti installed successfully!"
echo "========================================"
echo " Restart your terminal or run:"
echo '   export PATH="$HOME/.mitti/bin:$PATH"'
echo " Then test:"
echo "   mitti --version"
echo ""

