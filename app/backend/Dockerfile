FROM python:3.12-slim

#Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Setup Non-Root User for Dev Container
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

#Install System Dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Prepare Storage and Permissions
RUN mkdir -p /storage && chown -R $USERNAME:$USERNAME /app /storage

# Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Project Files with Correct Ownership
COPY --chown=$USERNAME:$USERNAME . .

EXPOSE 8000

# Switch to Non-Root User
USER $USERNAME

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
