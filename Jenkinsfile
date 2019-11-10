pipeline {
    agent {
        label 'Linux'
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