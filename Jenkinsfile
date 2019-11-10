pipeline {
    agent {
        docker {
            label 'Linux'
            image 'node:10'
        }
    }
    options {
        buildDiscarder(logRotator(numToKeepStr:'10'))
    }
    stages {
        stage('Build'){
            steps{
                sh 'npm test'
            }
        }
	}
}