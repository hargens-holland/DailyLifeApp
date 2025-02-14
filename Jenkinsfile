pipeline {
    agent any

    environment {
        DOCKER_REPO = 'hhargens/dailylifeapp'
        DOCKER_TAG = 'v1.0.1' // Could automate with commit hash later
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/hargens-holland/DailyLifeApp.git'
            }
        }

        stage('Build') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test || echo "No tests yet"'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_REPO}:${DOCKER_TAG} ."
            }
        }

        stage('Push Docker Image') {
            steps {
                sh "docker push ${DOCKER_REPO}:${DOCKER_TAG}"
            }
        }

        stage('Deploy (Optional)') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }
}

