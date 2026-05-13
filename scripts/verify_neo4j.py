"""Verify Neo4j Aura connectivity using the official Python driver.

Usage:
    pip install -r requirements.txt
    python scripts/verify_neo4j.py
"""

import os
import sys

from neo4j import GraphDatabase


def main() -> int:
    uri = os.environ.get("NEO4J_URI")
    username = os.environ.get("NEO4J_USERNAME", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD")

    if not uri or not password:
        print("Missing NEO4J_URI or NEO4J_PASSWORD.")
        print("Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD, then rerun.")
        return 2

    with GraphDatabase.driver(uri, auth=(username, password)) as driver:
        driver.verify_connectivity()

    print("Neo4j connectivity verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
