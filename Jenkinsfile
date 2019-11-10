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
            agent {
                docker {
                    image "kaltura/nhoenix-$BUILD_NUMBER"
                    label "$NODE_NAME"
                }
            }
            steps{
                script {
                    sh 'npm test'
                }
            }
        }
	}
}