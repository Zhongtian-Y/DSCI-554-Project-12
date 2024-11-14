# Use the latest stable Node.js
# For Windows and Mac users with intel Silicon, use the following line
FROM node:20.16.0

# For Mac users with Apple Silicon, use the following line instead and comment out the previous line
# FROM --platform=linux/amd64 node:20.16.0

# Install http-server
RUN npm install -g http-server

# Install Python
RUN apt-get clean &&\
    apt-get update &&\
    apt-get install -y software-properties-common &&\
    apt-get install -y python3.11 python3-pip python3.11-venv

# Install R and RStudio
RUN apt-get update && apt-get install -y \
    r-base \
    r-base-dev \
    gdebi-core && \
    wget https://download1.rstudio.org/electron/jammy/amd64/rstudio-2024.04.2-764-amd64.deb && \
    gdebi -n rstudio-2024.04.2-764-amd64.deb

# Clean up APT when done
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Intall Git
RUN apt-get update && apt-get install -y git

# Set the working directory
WORKDIR /app

# Create virtual environment for Python
RUN python3 -m venv /app/venv
RUN /app/venv/bin/pip install --upgrade pip

# Install Python packages
COPY requirements.txt /app/
RUN /app/venv/bin/pip install -r /app/requirements.txt

# Install Node packages
COPY package.json /app/
RUN npm install

# Copy the rest of the application code
COPY . /app/

# STREAMLIT SETUP (NOT REQUIRED IF ACTIVATING VIRTUAL ENVIRONMENT)

# Expose Streamlit port
# EXPOSE 8501

# Set environment variables for Streamlit
# ENV PATH="/app/venv/bin:$PATH"
# ENV STREAMLIT_SERVER_PORT=8501
# ENV STREAMLIT_SERVER_ADDRESS=0.0.0.0

# Command to run Streamlit app
# CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]

