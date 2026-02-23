import os
import subprocess

# Root directory of the repo
REPO_ROOT = os.path.abspath(os.getcwd())

# Folders to ignore completely
IGNORE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    "data",
    ".idea",
    ".vscode"
}

# File extensions to ignore (optional)
IGNORE_FILES = {
    ".pyc",
    ".log"
}


def should_ignore(path):
    parts = path.split(os.sep)
    for part in parts:
        if part in IGNORE_DIRS:
            return True
    return False


def is_ignored_file(filename):
    return any(filename.endswith(ext) for ext in IGNORE_FILES)


def git_command(cmd):
    subprocess.run(cmd, check=True)


def main():
    os.chdir(REPO_ROOT)

    for root, dirs, files in os.walk(REPO_ROOT):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if is_ignored_file(file):
                continue

            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, REPO_ROOT)

            if should_ignore(relative_path):
                continue

            print(f"Committing: {relative_path}")

            try:
                git_command(["git", "add", relative_path])
                git_command([
                    "git",
                    "commit",
                    "-m",
                    f"Added {relative_path}"
                ])
            except subprocess.CalledProcessError:
                print(f"Skipped (maybe already committed): {relative_path}")

    print("All files committed individually.")


if __name__ == "__main__":
    main()