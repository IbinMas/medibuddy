pipeline {
    agent {
        label "docker3"
    }
    environment {
        DOCKERHUB_CRED      = credentials('DOCKERHUB_CRED')
        REG_AML_CRED        = credentials('REG_AML_CRED')
        USER_CREDENTIALS    = credentials('dev-swarm-manager-user-password')
        SERVICE             = "medibuddy"
        STACK               = "test"
        registry_URL        = "reg-aml.esoko.com"

        IMAGE_BACKEND       = "reg-aml.esoko.com/develop.esoko/medibuddy-backend"
        IMAGE_WEB           = "reg-aml.esoko.com/develop.esoko/medibuddy-web"
        TAG                 = "alpha"

        imageName_BACKEND   = "reg-aml.esoko.com/deveops-test.img/medibuddy-backend"
        imageName_WEB       = "reg-aml.esoko.com/deveops-test.img/medibuddy-web"

        imageTag            = "${env.BUILD_ID}"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Init Environment') {
            steps {
                script {
                    env.TAG_NAME = sh(script: "git tag --points-at=HEAD || echo 'none'", returnStdout: true).trim()
                    echo "TAG_NAME = ${env.TAG_NAME}"
                }
            }
        }

        stage("Trivy Repo Scan") {
            steps {
                script {
                    echo "Running Trivy File System Scan (pre-build)..."
                    sh """ ... """
                }
            }
            /*
            post {
                always {
                    publishHTML(...)
                    archiveArtifacts ...
                }
            }
            */
        }

        stage("Build and Push - Dev") {
            when {
                anyOf { branch 'develop'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            parallel {
                stage("Backend") {
                    steps {
                        sh "docker build -f backend/Dockerfile -t ${env.IMAGE_BACKEND}:${env.TAG} ."
                        sh "docker push ${env.IMAGE_BACKEND}:${env.TAG}"
                    }
                }
                stage("Web") {
                    steps {
                        sh "docker build -f web/Dockerfile -t ${env.IMAGE_WEB}:${env.TAG} ."
                        sh "docker push ${env.IMAGE_WEB}:${env.TAG}"
                    }
                }
            }
        }

        stage("Prune after Dev build") {
            when {
                anyOf { branch 'develop'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            steps {
                sh "docker system prune -f"
            }
        }

        stage("Trivy Image Scan Dev") {
            when {
                anyOf { branch 'develop'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            steps {
                script {
                    echo "Running Trivy Image Scan (post-build)..."
                    sh """ ... """
                }
            }
            /*
            post {
                always {
                    publishHTML(...)
                    archiveArtifacts ...
                    script {
                        ...
                        slackSend(...)
                    }
                }
            }
            */
        }

        stage("Build - prod") {
            when { tag "v*" }
            parallel {
                stage("Backend") {
                    steps {
                        sh "docker build -f backend/Dockerfile -t ${env.imageName_BACKEND}:${env.TAG_NAME} ."
                    }
                }
                stage("Web") {
                    steps {
                        sh "docker build -f web/Dockerfile -t ${env.imageName_WEB}:${env.TAG_NAME} ."
                    }
                }
            }
        }

        stage("Trivy Image Scan - PROD") {
            when { tag "v*" }
            steps {
                script {
                    echo "Running Trivy Image Scan for PROD images..."
                    sh """ ... """
                }
            }
            /*
            post {
                always {
                    publishHTML(...)
                    archiveArtifacts ...
                    script {
                        ...
                        slackSend(...)
                    }
                }
            }
            */
        }

        stage("release") {
            when { tag "v*" }
            steps {
                sh "docker login --username ${DOCKERHUB_CRED_USR} --password '${DOCKERHUB_CRED_PSW}'"
                sh "docker push ${env.imageName_BACKEND}:${env.TAG_NAME}"
                sh "docker push ${env.imageName_WEB}:${env.TAG_NAME}"
            }
        }
    }

    /*
    post {
        success {
            script {
                slackSend(...)
            }
        }
        failure {
            script {
                slackSend(...)
            }
        }
        always {
            cleanWs(...)
        }
    }
    */
}
