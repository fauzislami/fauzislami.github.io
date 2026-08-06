---
title: "CI/CD Labs Part 3: Integrate Jenkins with Openshift"
date: 2021-03-26
type: post
url: "/blog/2021/03/26/ci-cd-labs-part-3-integrate-jenkins-with-openshift/"
tags: ["CI/CD", "Jenkins", "OpenShift"]
draft: false
---

In this part 3 CI / CD lab the author will document how to integrate Jenkins with the OpenShift.

What should be prepared:

*   1 VM Jenkins  
    Spec:  
    OS: Centos 7.9 (optional)  
    • RAM: 16GB (this will be used until labs finish)  
    • CPU: 4vCPU  
    • HDD: 100GB  
    • Internet connection
    
*   1 VM CRC (CodeReady Container) Mini OpenShift  
    Spec:  
    OS: Centos 7.9 (optional)  
    • RAM: 16GB (this will be used until labs finish)  
    • CPU: 4vCPU  
    • HDD: 100GB  
    • Internet connection
    

Inside the VM is installed:

**Jenkins (run as service)**

*   Openjdk1.8
*   Maven 3.6.3
*   Docker client
*   Git
*   IP Address = 192.168.1.116:8080

**CodeReady Container**

*   IP Address = 192.168.1.114

**OpenShift Configurations**

In this lab the author uses a CRC (CodeReady Container) which is a lightweight version of OpenShift and is only for development needs. However, the resources that will be used will be the same as production-ready OpenShift. For crc installation, see the official documentation link here [https://code-ready.github.io/crc/](https://code-ready.github.io/crc/)

First, log into the cluster by using a user who has the cluster-admin role. Here I used a virtual user who has been generated during the CRC installation process, namely kubeadmin.

```
[oji@crc ~]$ oc login -u kubeadmin -p D4tTL-hJYdy-qe36Y-okTwh https://api.crc.testing:6443
Login successful.
You have access to 61 projects, the list has been suppressed. You can list all projects with ' projects'

Using project "default".</pre>

[oji@crc ~]$ oc whoami
kube:admin
```

After successfully logging in, it’s time to create projects. The projects that will be made are dev (development), sim (simulation), and prod (production).

```
[oji@crc ~]$ oc new-project dev
[oji@crc ~]$ oc new-project sim
[oji@crc ~]$ oc new-project prod
```

Then create a service account in each of these projects for Jenkins to use in order to manage the project.

```
[oji@crc ~]$ oc create sa jenkins -n dev
[oji@crc ~]$ oc create sa jenkins -n sim
[oji@crc ~]$ oc create sa jenkins -n prod
```

Then give a role to the service account that has been created in each of these projects with role **edit** so that Jenkins can create, delete, and modify any resources in its project.

```
[oji@crc ~]$ oc policy add-role-to-user edit system:serviceaccount:dev:jenkins -n dev
[oji@crc ~]$ oc policy add-role-to-user edit system:serviceaccount:sim:jenkins -n sim
[oji@crc ~]$ oc policy add-role-to-user edit system:serviceaccount:prod:jenkins -n prod
[oji@crc ~]$ oc policy add-role-to-group system:image-puller system:serviceaccounts:dev -n dev
[oji@crc ~]$ oc policy add-role-to-group system:image-puller system:serviceaccounts:sim -n sim
[oji@crc ~]$ oc policy add-role-to-group system:image-puller system:serviceaccounts:prod -n prod
```

Now the last step from the openshift side is to create credentials from the image registry for each project. Here I used nexus which in part 1 has been configured to save the image. However, for this part 3 lab it is not yet used, it will be used on the last lab. It is the implementation of full CI / CD.

```
[oji@crc ~]$ oc create secret docker-registry nexus-registry --docker-server=nexus-registry.lab.example.com:5000 --docker-username=admin --docker-password=admin -n dev

[oji@crc ~]$ oc create secret docker-registry nexus-registry --docker-server=nexus-registry.lab.example.com:5000 --docker-username=admin --docker-password=admin -n sim

[oji@crc ~]$ oc create secret docker-registry nexus-registry --docker-server=nexus-registry.lab.example.com:5000 --docker-username=admin --docker-password=admin -n prod
```

```
[oji@crc ~]$ oc secrets link default nexus-registry –for=pull -n dev
[oji@crc ~]$ oc secrets link default nexus-registry –for=pull -n sim
[oji@crc ~]$ oc secrets link default nexus-registry –for=pull -n prod
oji@crc ~]$ oc secrets link builder nexus-registry -n dev
oji@crc ~]$ oc secrets link builder nexus-registry -n sim
oji@crc ~]$ oc secrets link builder nexus-registry -n prod
oji@crc ~]$ oc secrets link builder nexus-registry -n prod
```

**Jenkins**

First, Login as an admin to Jenkins

![Scratchpad](/images/ci-cd-labs-part3/1.png "Scratchpad")

Install the required plugins on the **Manage Jenkins menu** -> **Manage Plugins** -> **\[TAB\] Available**. Then install the plugin below:

*   OpenShift Login Plugin
*   OpenShift Client Jenkins Plugin

Then select **_Install without restarting_**

Now I will create a credential in jenkins using the token in the service account that was created in openshift. To view these tokens you can use the command below:

```
[oji@crc ~]$ oc sa get-token jenkins -n dev
[oji@crc ~]$ oc sa get-token jenkins -n sim
[oji@crc ~]$ oc sa get-token jenkins -n prod
```

Perintah di atas akan menampilkan token. Selanjutnya _copy-paste_ token tersebut untuk ditambahkan pada credential jenkins.

**Credential ocp-dev**

![Scratchpad](/images/ci-cd-labs-part3/2.png "Scratchpad")

**Credential ocp-sim**

![Scratchpad](/images/ci-cd-labs-part3/3.png "Scratchpad")

**Credential ocp-prod**

![Scratchpad](/images/ci-cd-labs-part3/4.png "Scratchpad")

Next, I’ll integrate jenkins to bitbucket by going to the **Manage Jenkins** menu -> **Configure System** -> **OpenShift Client Plugin**. Provide the cluster name for openshift and the URL for the apiserver from openshift to integrate. Then for the token enter the token that was previously created. In this lab, because I’m using CRC, the environment will be simulated only with different projects but in the same cluster. At the time of its implementation, the best practice is to separate each environment with a different cluster.

Then to test the connection, I made a job containing a pipeline to check the availability of each cluster.

Select **New Item** -> **Pipeline**, then name the job. Then the Pipeline field can be adjusted as shown below :

Pipeline :

```
pipeline {
    agent any
    
    stages {
        stage('Connection Test for DEV') {
            steps {
                    script {
                    openshift.withCluster( 'ocp-dev' ) {
                        openshift.withProject( 'dev' ) {
                            echo "Hello from project ${openshift.project()} in cluster ${openshift.cluster()}"
                            }
                        }   
                    
                }
            }
        }
        
        stage('Connection Test for SIM') {
            steps {
                    script {
                    openshift.withCluster( 'ocp-sim' ) {
                        openshift.withProject( 'sim' ) {
                            echo "Hello from project ${openshift.project()} in cluster ${openshift.cluster()}"
                            }
                        }   
                    
                }
            }
        }
        
        stage('Connection Test for PROD') {
            steps {
                    script {
                    openshift.withCluster( 'ocp-prod' ) {
                        openshift.withProject( 'prod' ) {
                            echo "Hello from project ${openshift.project()} in cluster ${openshift.cluster()}"
                            }
                        }   
                    
                }
            }
        }

    }
    
}
```

Then save.

Then do a build. It can be seen that the pipeline was going well and successful.

![Scratchpad](/images/ci-cd-labs-part3/5.png "Scratchpad")

![Scratchpad](/images/ci-cd-labs-part3/6.png "Scratchpad")
