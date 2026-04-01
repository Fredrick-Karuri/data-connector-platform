FROM python:3.12

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/workspace/app/backend

# Setup Non-Root User
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# System Dependencies (Standard Debian Node & DB Drivers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Storage & Requirements
RUN mkdir -p /storage && chown -R $USERNAME:$USERNAME /workspace /storage
# DRY: Install requirements during build so they are ready on startup
COPY app/backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

USER $USERNAME
