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
                    sh '''
                        mkdir -p trivy-reports

                        docker run --rm \
                          -v $(pwd):/src \
                          -v $(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 fs /src \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-fs-report.json

                        docker run --rm \
                          -v $(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-fs-report.html \
                          /reports/trivy-fs-report.json
                    '''
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
                anyOf {
                    branch 'develop'
                    branch 'Sprint*'
                    branch 'Hotfix*'
                    branch 'master'
                    branch 'main'
                    branch 'sprint*'
                    branch 'feature/*'
                    branch 'cicd-feature/*'
                }
            }
            parallel {
                stage("Backend") {
                    steps {
                        sh '''
                            docker build -f backend/Dockerfile -t $IMAGE_BACKEND:$TAG .
                            docker push $IMAGE_BACKEND:$TAG
                        '''
                    }
                }
                stage("Web") {
                    steps {
                        sh '''
                            docker build -f web/Dockerfile -t $IMAGE_WEB:$TAG .
                            docker push $IMAGE_WEB:$TAG
                        '''
                    }
                }
            }
        }

        stage("Prune after Dev build") {
            when {
                anyOf {
                    branch 'develop'
                    branch 'Sprint*'
                    branch 'Hotfix*'
                    branch 'master'
                    branch 'main'
                    branch 'sprint*'
                    branch 'feature/*'
                    branch 'cicd-feature/*'
                }
            }
            steps {
                sh 'docker system prune -f'
            }
        }

        stage("Trivy Image Scan Dev") {
            when {
                anyOf {
                    branch 'develop'
                    branch 'Sprint*'
                    branch 'Hotfix*'
                    branch 'master'
                    branch 'main'
                    branch 'sprint*'
                    branch 'feature/*'
                    branch 'cicd-feature/*'
                }
            }
            steps {
                script {
                    echo "Running Trivy Image Scan (post-build)..."
                    sh '''
                        mkdir -p trivy-reports

                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v $(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 image \
                          --username $REG_AML_CRED_USR \
                          --password $REG_AML_CRED_PSW \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-backend-image-report.json \
                          $IMAGE_BACKEND:$TAG

                        docker run --rm \
                          -v $(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-backend-image-report.html \
                          /reports/trivy-backend-image-report.json
                    '''
                }
            }
            /*
            post {
                always {
                    ...
                }
            }
            */
        }

        stage("Build - prod") {
            when { tag "v*" }
            parallel {
                stage("Backend") {
                    steps {
                        sh '''
                            docker build -f backend/Dockerfile -t $imageName_BACKEND:$TAG_NAME .
                        '''
                    }
                }
                stage("Web") {
                    steps {
                        sh '''
                            docker build -f web/Dockerfile -t $imageName_WEB:$TAG_NAME .
                        '''
                    }
                }
            }
        }

        stage("Trivy Image Scan - PROD") {
            when { tag "v*" }
            steps {
                script {
                    echo "Running Trivy Image Scan for PROD images..."
                    sh '''
                        mkdir -p trivy-reports

                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v $(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 image \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-prod-backend-image-report.json \
                          $imageName_BACKEND:$TAG_NAME
                    '''
                }
            }
        }

        stage("release") {
            when { tag "v*" }
            steps {
                sh '''
                    docker login --username $DOCKERHUB_CRED_USR --password $DOCKERHUB_CRED_PSW
                    docker push $imageName_BACKEND:$TAG_NAME
                    docker push $imageName_WEB:$TAG_NAME
                '''
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
