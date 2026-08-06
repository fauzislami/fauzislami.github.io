---
title: "CI/CD Labs Part 2: Integrate Jenkins with Bitbucket Server"
date: 2021-03-05
type: post
url: "/blog/2021/03/05/ci-cd-labs-part-2-integrate-jenkins-with-bitbucket-server/"
tags: ["BitBucket", "CI/CD", "Jenkins"]
draft: false
---

![CI/CD Part 2](/images/ci-cd-labs-part2/1.png "CI/CD Part 2")

In this part 2 of the CI / CD labs, I will document how to do Jenkins integration with the Bitbucket server (not the cloud).

What should be prepared :

1 VM (Jenkins + Bitbucket Server)  
Specifications :  
• OS Centos 7.9 (optional)  
• RAM: 16GB (this will be used until labs get finished)  
• CPU: 4vCPU  
• HDD: 100GB  
• Internet connection

Inside the VM are installed as follows :

**Jenkins (run as a service)**  
– Openjdk1.8  
– Maven 3.6.3  
– Docker client  
– Git  
– IP address = 192.168.1.116:8080

**Bitbucket Server (run as a container)**  
– IP address = 192.168.1.116:7990

**Bitbucket Server Configurations**

Bitbucket Server is a git-based source code management which is self-hosted. It’s different with Bitbucket.org that we may access it publicly, but they still have the same main functionality, that is as a source code repository.

Here are the configuration steps:

*   Login to Bitbucket as an admin, then create a Personal Access Token

![CI/CD Part 2](/images/ci-cd-labs-part2/2.png "CI/CD Part 2")

*   The following is a token that has been created (it must be noted because it can’t be seen again after the continue button is pressed)

![CI/CD Part 2](/images/ci-cd-labs-part2/3.png "CI/CD Part 2")

![CI/CD Part 2](/images/ci-cd-labs-part2/15.png "CI/CD Part 2")

*   Then create a new project

![CI/CD Part 2](/images/ci-cd-labs-part2/4.png "CI/CD Part 2")

*   This is a project that was created:

![CI/CD Part 2](/images/ci-cd-labs-part2/5.png "CI/CD Part 2")

Furthermore, from this project we create a new repository

![CI/CD Part 2](/images/ci-cd-labs-part2/6.png "CI/CD Part 2")

The following is the contents of the new repository which has been filled in by the files used in the previous lab.

![CI/CD Part 2](/images/ci-cd-labs-part2/7.png "CI/CD Part 2")

The final step is to create a webhook in the repository

![CI/CD Part 2](/images/ci-cd-labs-part2/8.png "CI/CD Part 2")

**Jenkins Configurations**

Here are the configuration steps:

*   Log in first as an admin to Jenkins

![CI/CD Part 2](/images/ci-cd-labs-part2/9.png "CI/CD Part 2")

Install the required plugins on the **Manage Jenkins** menu -> **Manage Plugins** -> \[TAB\] **Available**. Then install the plugin below:  
– Bitbucket Server Integration

Then select **Install without restart**

Now I will create a credential in Jenkins using the token previously generated in Bitbucket.

![CI/CD Part 2](/images/ci-cd-labs-part2/10.png "CI/CD Part 2")

Then it’s time to integrate jenkins to bitbucket by going to the **Manage Jenkins menu** -> **Configure System** -> **Bitbucket Server Integration**. Provide an instance name for the bitbucket and the URL of the bitbucket server to integrate to. Then for the token enter the token that was previously created. Then to make sure Jenkins can **_handshake_** the Bitbucket, click the test connection button.

![CI/CD Part 2](/images/ci-cd-labs-part2/11.png "CI/CD Part 2")

Then the final step is to create a job from a pipeline defined in the Jenkinsfile which is stored in the Bitbucket repository that was created in the previous step.

Select **New Item** -> **Pipeline**, then name the job. Then in the **Build Triggers** field, do a check-list on the **Bitbucket Server trigger build after push** checkbox. And the **Pipeline** field can be adjusted as shown below:

![CI/CD Part 2](/images/ci-cd-labs-part2/12.png "CI/CD Part 2")

Then save it.

Then do the build (either by making changes to the repository or by doing a manual build). It can be seen that the pipeline was going well and being successful.

![CI/CD Part 2](/images/ci-cd-labs-part2/13.png "CI/CD Part 2")
