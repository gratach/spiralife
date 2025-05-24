![Spiral Calendar](images/calendar.png)

# Spiralife

Spiralife is a Python package that provides a script for generating spiral shaped calendars.
This guide explains how to install Spiralife from this repository.


## Prerequisites

Before installing Spiralife, ensure the following dependencies are installed on your system:

```bash
sudo apt install libcairo2-dev pkg-config python3-dev
```

These are required for the `pycairo` library.

## Installation

To install Spiralife using `pip` from this repository, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/gratach/spiralife.git
    cd spiralife/python
    ```

2. Install the package using `pip`:
    ```bash
    pip install .
    ```

## Usage

After installation, you can run the Spiralife script to generate a spiral calendar. Use the following command:

```bash
spiralife -o output.svg -y 2020 -m 2 -d 20
```

For more options, run:

```bash
spiralife --help
```