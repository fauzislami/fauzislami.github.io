---
title: "JCasC (Jenkins Configuration as Code) : Setting up Jenkins in a fully reproducible way"
date: 2022-02-18
type: post
url: "/blog/2022/02/18/jcasc-jenkins-configuration-as-code-setting-up-jenkins-in-a-fully-reproducible-way/"
tags: ["Jcasc", "Jenkins"]
draft: false
---

{{< notice "info" >}}

**This post has some corrupted data. Will fix it soon!**

{{< /notice >}}

Never thought that the ‘as code’ paradigm would spread out to the Infrastructure area. It works like magic while writing code to define what our infrastructure will be. It does make sense considering virtualization has been implemented everywhere these days. Knowing that virtualization itself consists of thousands of lines of codes (my assumption), it’s clearly possible to have an approach to codify every part of the infrastructure in order to build it. That’s how the brief of the emergence of **Infrastructure as Code (IaC)**.

Actually, the ‘as code’ paradigm doesn’t only apply on the high-level point of view like Infrastructure, it also even applies to specific tools like Jenkins. It’s called **JCasC (Jenkins Configuration as Code)**. JCasC means enabling us to reproduce and/or restore a full environment based on recipes and automation which is managed by code. Setting up Jenkins is a quite long and complex process if we do it manually. As both Jenkins and its plugins require some tuning and configuration with dozens of parameters to set within the web UI manage section. JCasC provides the ability to define this whole configuration in a simple and human-friendly yaml syntax. Without any manual steps, this configuration can be validated and applied to Jenkins in a fully reproducible way.

Throughout this article, I want to share how we did this approach in order to set up Jenkins for migration purposes and a bit of lesson learned we got from it. The first objective is to replicate the general configurations, jobs, plugins, and credentials from the old Jenkins to the new Jenkins instance in different Kubernetes clusters. The interesting thing is that the new Jenkins uses the GitOps approach and automatically it also applies IaC where there is Bitbucket as its single source of truth. Whenever changes are made, the cluster will reconcile the desired state defined in Bitbucket. To make it easier to understand, refer to the picture below :

The picture above depicts how the new Jenkins is deployed and maintained using the GitOps approach. In this case, we’re using FluxCD to accommodate the cluster state by always monitoring the desired state defined on Bitbucket and the actual state on the cluster. We also use Kustomize to work with FluxCD to add, remove, or even update the configuration. Actually, in this implementation, Helm is also being used but it’s not covered here. 

Okay hopefully the explanation of IaC-related things above is quite clear, let’s get focused on JCasC.

As previously discussed, JCasC enables us to get Jenkins works out of the box as all expected configurations have been defined and executed since the initial running. We can make it works by installing a plugin named [Configurations as Code](https://plugins.jenkins.io/configuration-as-code/). Once the plugin is installed, we can define the configuration through a file, named jenkins.yaml ( see this for an example : [jenkins.yaml](https://plugins.jenkins.io/configuration-as-code/) ). After all, we can also decide where it loads that file to take effect. In order to implement this approach, there should be any considerations and concerns regarding setting up the jobs, tools, security and credentials but it will be covered here for further elaboration.

There is no standard rule to save that file as it’s completely optional, that YAML file can go wherever we want but it’s a common path to save it in `$JENKINS_HOME/casc/jenkins.yaml`. Maybe we start to wonder why the configuration file is loaded after Jenkins is already running. Actually, this article is addressed for Jenkins running in a container, so the configuration can be loaded since the first time Jenkins runs by adding an environment variable `CASC_JENKINS_CONFIG` to tell the plugin where to load the file. It can also apply on Jenkins that runs as a service like systemd service in a VM but with different approach, the only possible solution (for now) is storing the configuration file manually to a certain directory and add an environment variable like this `JAVA_OPTS -Djenkins.install.runSetupWizard=false` to the Jenkins systemd configuration to skip the setup wizard and also don’t forget to set this environment variable `CASC_JENKINS_CONFIG`. Afterward, start the Jenkins service and it should work the same as the container one.

Jump to the next discussion. For this case, we classify some points on Jenkins into **frequently changed configurations** and **infrequently changed configurations**.  The only reason to do that is to prevent technical debt in the future because we consider storing things classified as infrequently changed configurations to be manifested on the repository and let the rest stored on PV (Persistent Volume) on the cluster as they are frequently changed configurations. We want to minimize or even avoid the additional rework caused by choosing a solution that looks easy for now but will get more complex as time goes on. For instance, Jobs are considered to have dynamic changes (add, remove, or modify jobs) and it will give us continual rework if we store them as manifest which will always be done manually whenever we expect some changes. Therefore, the final decision looks like below :

```
<td class="has-text-align-center" data-align="center">
  <strong>Infrequently changed configurations</strong>
</td>
```

```
<td class="has-text-align-center" data-align="center">
  Plugins
</td>
```

```
<td class="has-text-align-center" data-align="center">
  Credentials
</td>
```

**Description :**

*   **Jobs** are confirmed to be dynamically changing and considering letting it be stored on PV (Persistent Volume) rather than written on the manifest. Yes, it’s possible to write it down into manifest as it’s already documented [here](https://jenkinsci.github.io/job-dsl-plugin/) using JobDSL syntax, but the problem comes when there will be a pipeline that uses a plugin that doesn’t have DSL syntax, the only way to overcome that issue is configuring the pipeline via Jenkins web UI. In the end, the IaC goals are not fully achieved. Aside from that, it will take us quite a long time to write the syntax of every job creation in the future and the number of lines of code will continually increase. But in certain conditions where Jenkins will have fewer changes or fixed configuration and amount of jobs, it might be suitable to be manifested. 
*   **Plugins** are confirmed to have fewer changes since all the required plugins have been installed. In case any additional plugins are expected to be installed, we just simply add the name of plugins and the version we want to install to manifest and push it to Bitbucket. After that, just wait for FluxCD to reconcile the recent changes into the cluster.
*   **Credentials** are considered to have infrequent changes, so there is a small possibility of change. But it’s interesting to note that credentials are not considered to be manifested even though it has infrequent changes, it’s because we don’t want to expose any sensitive information even if it’s stored in a private repository.

**Additional notes :**

Re-checking the current configuration of the new Jenkins is necessary, especially for credentials. Just found this doc, it tells that credentials are not portable between instances because the encryption of credentials is done using the Jenkins-internal secret key which is unique for every Jenkins instance. It looks like necessary to create a short article related to this specific topic separately later.

References :  
1.[https://stackoverflow.com/questions/38465270/wheres-the-encryption-key-stored-in-jenkins?noredirect=1&lq=1](https://stackoverflow.com/questions/38465270/wheres-the-encryption-key-stored-in-jenkins?noredirect=1&lq=1)  
2.[https://stackoverflow.com/questions/30704856/how-to-export-credentials-from-one-jenkins-instance-to-another](https://stackoverflow.com/questions/30704856/how-to-export-credentials-from-one-jenkins-instance-to-another)  
3.[https://itsecureadmin.com/2018/03/jenkins-migrating-credentials/](https://itsecureadmin.com/2018/03/jenkins-migrating-credentials/)
