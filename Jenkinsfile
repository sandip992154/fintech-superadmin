pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        PROJECT_DIR = "/var/www/myreactapp"
        REPO_URL = "https://github.com/BandaruPay/superadmin.git"
        CREDENTIALS_ID = "FirewingTechnology"
        NODE_VERSION = "18"  // adjust Node version as needed
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: env.BRANCH_NAME ?: 'main',
                    credentialsId: "${CREDENTIALS_ID}",
                    url: "${REPO_URL}"
            }
        }

        stage('Ensure Jenkins User Exists') {
            steps {
                sh """
                if id "jenkins" &>/dev/null; then
                    echo "Jenkins user exists"
                else
                    echo "Creating Jenkins user..."
                    sudo useradd -m -s /bin/bash jenkins
                fi
                """
            }
        }

        stage('Install Node & Build React') {
            steps {
                dir("${WORKSPACE}") {
                    sh """
                    echo "📦 Installing Node modules"
                    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                    sudo apt-get install -y nodejs

                    npm install
                    npm run build
                    """
                }
            }
        }

        stage('Deploy React App') {
            steps {
                sh """
                echo "🚀 Deploying React build to ${PROJECT_DIR}"

                sudo mkdir -p ${PROJECT_DIR}
                sudo rsync -av --delete build/ ${PROJECT_DIR}/
                sudo chown -R www-data:www-data ${PROJECT_DIR}
                sudo chmod -R 755 ${PROJECT_DIR}
                """
            }
        }

        stage('Restart Nginx') {
            steps {
                sh """
                echo "🔧 Testing Nginx config..."
                sudo nginx -t

                echo "🔄 Reloading Nginx..."
                sudo systemctl reload nginx
                sudo systemctl status nginx --no-pager | head -20
                """
            }
        }
    }

    post {
        success {
            echo "🎉 React deployment successful!"
        }
        failure {
            echo "❌ Deployment failed — check Jenkins logs!"
        }
    }
}
