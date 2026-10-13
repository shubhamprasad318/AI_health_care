"""
Download the DDXPlus dataset without training.

Fetches the dataset and its two metadata files (release_evidences.json,
release_conditions.json) into the local Hugging Face cache
(~/.cache/huggingface by default, override with HF_HOME). train.py reads
from the same cache, so a later training run skips the download.

Useful for pre-fetching on a fast connection, or for exploring the data
before training.

Run:
    cd training
    python download_dataset.py
"""

from __future__ import annotations

from collections import Counter

from train import DATASET_REPO, load_dataset, log


def main() -> None:
    df, evidences_meta, conditions_meta = load_dataset()

    log.info("Dataset %s is cached locally.", DATASET_REPO)
    log.info("Rows per split: %s", dict(Counter(df["__split__"])))
    log.info("Columns: %s", ", ".join(c for c in df.columns if c != "__split__"))
    log.info("Pathologies: %d", df["PATHOLOGY"].nunique())
    log.info("Evidence definitions: %d", len(evidences_meta))
    log.info("Condition definitions: %d", len(conditions_meta))


if __name__ == "__main__":
    main()
