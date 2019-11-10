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
                script {
                    docker.build("kaltura/nhoenix-$BUILD_NUMBER")
                }
            }
        }
        stage('Test'){		
            steps{
                script {
                    docker.run("kaltura/nhoenix-$BUILD_NUMBER")
                }
            }
        }
	}
}