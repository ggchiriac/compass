# Hoagie Plan (Backend)

<div align="center">
  <img src="docs/django.png" alt="Django Logo" width="720">
</div>

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Configuration](#configuration)
6. [Contributing](#contributing)
7. [License](#license)
8. [Acknowledgments](#acknowledgments)

## Introduction

This directory contains the backend logic for [Hoagie Plan](https://plan.hoagie.io/).

## Features

- ⚡️ Fast convolutions using [Flash FFT](https://github.com/HazyResearch/flash-fft-conv)
- 🚀 Fast, local attention using (sliding window) [Flash Attention](https://github.com/Dao-AILab/flash-attention)
- 🌐 Support for distributed training using [DDP](https://pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html) and [FSDP](https://pytorch.org/docs/stable/fsdp.html)

## Installation

> Hoagie Plan requires [Homebrew](https://brew.sh/).
1. Install Homebrew with the following command:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install PostgreSQL
```bash
brew install postgresql@17
```

3. Install uv
```bash
brew install uv
```

> Note: Make sure you are in the `backend` directory.

1. Create a virtual environment, e.g. `.venv`:
    ```bash
    uv init hoagie-plan
    ```

2. Activate the virtual environment:
    ```bash
    source .venv/bin/activate
    ```

3. Install the [uv](https://docs.astral.sh/uv/) package manager:
    ```bash
    pip install uv
    ```

2. Install required packages:
   ```bash
   uv sync
   ```

## Usage

### Using Flash STU



### Training

An example LLM pretraining script is provided in [`example.py`](training/example.py) for you to test out the repository.

If your compute cluster does not have internet access, you will need to pre-download the entire dataset before running the example training script.

To download the dataset, run:
```bash
cd training
python data.py
```

> **Note**: The FineWeb-Edu 10B-token sample is a relatively large dataset. It can be swapped out for something smaller, e.g. [TinyStories](https://huggingface.co/datasets/roneneldan/TinyStories) (476.6M tokens).

To begin training, make sure you are in the `training` directory and run the following command in your terminal:

```bash
torchrun example.py
```

If you are in a compute cluster that uses Slurm and [environment modules](https://modules.readthedocs.io/en/latest/index.html), you can submit a job using the following command:
```bash
sbatch job.slurm
```

Model configurations can be adjusted as needed in [`config.json`](training/config.json). Be sure to adjust the configurations of the [Slurm job](training/job.slurm) based on your cluster's constraints.

> **Note**: PyTorch's `torch.compile` currently does not have great support for distributed wrapper modules like DDP or FSDP. If you encounter errors during training, try disabling `torch.compile`. For more information on `torch.compile`, see this [informal manual](https://docs.google.com/document/d/1y5CRfMLdwEoF1nTk9q8qEu1mgMUuUtvhklPKJ2emLU8/edit#heading=h.ivdr7fmrbeab).


## Contributing

Contributions are welcomed! Writing performant distributed code is always tricky. We welcome contributors to:

- Submit pull requests
- Report issues
- Help improve the project overall

## License

Apache 2.0 License

You can freely use, modify, and distribute the software, **even in proprietary products**, as long as you:
- Include proper attribution
- Include a copy of the license
- Mention any changes made

It also provides an express grant of patent rights from contributors.

See the [LICENSE](LICENSE) file for more details.

## Acknowledgments

Special thanks to (in no particular order):
- Elad Hazan and the authors of the [Spectral State Space Models](https://arxiv.org/abs/2312.06837) paper
- Isabel Liu, Yagiz Devre, Evan Dogariu
- The Flash Attention team
- The Flash FFT team
- The PyTorch team
- Princeton Research Computing and Princeton Language and Intelligence, for supplying compute
- Andrej Karpathy, for his awesome [NanoGPT](https://github.com/karpathy/build-nanogpt) repository

## Citation

If you use this repository, or otherwise find our work valuable, please cite Flash STU:
```
@article{flashstu,
  title={Flash STU: Fast Spectral Transform Units},
  author={Y. Isabel Liu, Windsor Nguyen, Yagiz Devre, Evan Dogariu, Anirudha Majumdar, Elad Hazan},
  journal={arXiv preprint arXiv:2409.10489},
  year={2024},
  url={https://arxiv.org/abs/2409.10489}
}