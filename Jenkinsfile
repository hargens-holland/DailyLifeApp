pipeline {
   agent any
   stages {
     stage('Build') {
       steps {
         sh 'mvn clean install'
       }
     }
     stage('Test') {
       steps {
         sh 'mvn test'
       }
     }
     stage('Deploy') {
       steps {
         sh 'docker build -t myapp .'
         sh 'docker push myrepo/myapp'
       }
     }
   }
 }
pipeline {
    agent any
    stages {
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t myapp:latest .'
            }
        }
        stage('Run Docker Container') {
            steps {
                sh 'docker run -p 3000:3000 myapp:latest'
            }
        }
    }
}