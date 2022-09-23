pipeline {

    agent {
       node {
         label "${AGENT}"
       }
    }

    environment {
      agent_label = "$AGENT"
      branch = "$BRANCH_NAME"
    }

    stages {
        stage('check dependency') {
            steps {
              script {
                echo 'Check Dependency...'
                sh """
                command -v docker
                command -v sshpass
                """
              }

              script {
                if ("$VERSION" != "") {
                  env.version = "$VERSION"
                } else {
                  env.version = getDate()
                }
              }
              echo "$version"
            }
        }
        stage('build') {
            steps {
              echo 'Building...'
              sh """
              bash -x InHouseBuild.sh $version
              """
            }
        }
        stage('transmitting package') {
           steps {
               script {
                 def refId = getRefId()
                 def commitDate = getCommitDate()
                 sh """
                    echo "\"xcalscan-vscode-plugin\":{
                    \"GitRefId\":\"${refId}\",
                    \"Branch\":\"${branch}\",
                    \"Date\":\"${commitDate}\"
                     }" >> "VER.txt"
                    """
                 sh """
                    mkdir -p xcalscan-vscode-plugin/$branch/$version
                    mv *.vsix VER.txt xcalscan-vscode-plugin/$branch/$version
                 """
               }

               script {
                 if ("$agent_label" == "4.154-JenSlave") {
                    sh """
                    cp -r xcalscan-vscode-plugin /xcal-artifacts/inhouse
                    """
                 } else {
                    withCredentials([usernamePassword(credentialsId: 'sdlc_deploy', passwordVariable: 'password', usernameVariable:'user')]) {
                      sh """
                      sshpass -p $password scp -r xcalscan-vscode-plugin $user@127.0.0.1:/xcal-artifacts/inhouse
                      """
                 }
               }
              }
            }
        }
    }
}

def getRefId() {
    def branch = env.branch
    return sh(returnStdout: true, script: 'git show-ref | grep ${branch} | head -n 1 | awk \'{print $1}\'').trim()
}

def getCommitDate() {
   def ref = getRefId()
   return sh(returnStdout: true, script: 'git log --pretty=format:"%cd" ${ref} -1')
}

def getDate() {
    return sh(returnStdout: true, script: 'date +%Y.%-m.%-d').trim()
}
