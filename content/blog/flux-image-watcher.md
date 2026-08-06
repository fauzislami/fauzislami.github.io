---
title: "FluxCD: Image Watcher"
date: 2023-02-01
type: post
url: "/blog/flux-image-watcher/"
tags: ["Kubernetes", "Flux", "IaC"]
draft: false
---

This time I want to bring up a cool GitOps tool beside ArgoCD named [**FluxCD**](https://fluxcd.io/). But I won’t discuss about what it is and the comparison between ArgoCD and FluxCD just yet. Instead, I find FluxCD has a cool feature of many features it provides which I don’t find this in ArgoCD (at least as the time as I write this topic). Probably, the introduction topic of FluxCD itself is worth having later on and it’s generally similar to ArgoCD as both work in the same area for Continous Deployment. But yet again, now let’s have a go with one of its sophisticated feature 😄

# About Image Watcher

In this occasion, we will focus on how Image Watcher works in FluxCD. Image Watcher consists of two components. They are **Image Reflector Controller** and **Image Automation Controller**. Both have their own tasks in order to automate the flow of automatic deployment whenever some particular images are pushed to the image registry. Take a quick look at the diagram below:

![main picture](/images/flux-image-watcher/1.png "main picture")

As depicted on the above picture, the Image Reflector Controller will periodically monitor the image registry to fetch the latest metadata from certain images such as which one has the latest image tag. Afterward, it will get the necessary string format from the metadata that matches the pattern we define for the image, and then Image Automation will use that string format to get written in the repository. Finally, that change should be applied to the cluster as FluxCD continuously monitors the repository. It yields every image that has been pushed to the image registry which will affect the service deployment to be rolled out in a matter of minutes.

Since FluxCD is a Continuous Deployment solution tool for Kubernetes, it has some of its own object resources that should be applied after FluxCD installation, including Image Watcher. Regarding the Image Watcher object resources, they consist of:

## Image Repository

Here we define the image registry we want the Image Reflector monitor to. For instance:

```
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageRepository
metadata:
  name: <APP_NAME>
  namespace: <NS_NAME>
spec:
  image: <IMAGE>
  interval: 1m0s
  secretRef:
    name: <CREDENTIAL_SECRET>
```

It means, we want the Image Reflector to monitor an image in every minute.

## Image Policy

In a nutshell, we can define a rule for selecting the latest image from the scan result from ImageRepository. It’s used to drive the automation that will be done by Image Automation Controller. For instance:

```
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImagePolicy
metadata:
  name: <POLICY_NAME>
  namespace: <NS_NAME>
spec:
  imageRepositoryRef:
    name: <IMAGE_REPOSITORY_NAME>
  filterTags:
    pattern: ^v(?P<ver>(\d+\.)?(\d+\.)?(\*|\d+))-[a-fA-F0-9]+.*-<NS_NAME>
    extract: "$ver"
  policy:
    semver:
      range: '>=1.0.0'
```

It means, we want the Image Reflector to fetch the tag of the image as we can see in the above definition. It filters out the latest image tag that has been pushed to the image registry with a pattern like this: ^v(?P(\\d+.)?(\\d+.)?(\*|\\d+))-\[a-fA-F0-9\]+.\*-<NS\_NAME> and that would be matched with the image tag like _**v1.20.1-356340cv1cd16eetty670di854abm467agsbn-test-<NS\_NAME>**_.

Notice the extracted group ?P in the regex. This value will be extracted into group $ver and will be used by flux in semantic version policy defined earlier to find and matches the latest image.

![regex](/images/flux-image-watcher/3.png "regex")

We can adjust the FilterTags pattern to match our needs. Before applying policies in-cluster, we can validate our filters using a regex tester such as: [regex101](https://regex101.com/)

{{< notice "note" >}}

In this example we define the range ‘>=1.0.0’, so flux will fetch the latest image version that are newer or same as 1.0.0

{{< /notice >}}

We can also adjust the semver range based on our needs, for example it can be define with 1.0.x (patch versions only) or >=1.0.0 <2.0.0 (minor and patch versions). Please have a look at fluxcd documentation for the other policy [examples](https://fluxcd.io/docs/components/image/imagepolicies/#examples).

## Image Update Automation

It contains the configuration for how Image Automation Controller behaves to automate the image tag replacement in the git repository according to what we have defined in the ImagePolicy object. And the most important thing regarding this ImageUpdateAutomation, it’s used by the ImagePolicy marker in order to work. For instance:

```
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageUpdateAutomation
metadata:
  name: <APP_NAME>
  namespace: <NS_NAME>
spec:
  interval: 1m0s
  sourceRef:
    kind: GitRepository
    name: <GIT_REPO_NAME>
  git:
    checkout:
      ref:
        branch: master
    commit:
      author:
        email: fluxcdbot@fauzislami.com
        name: fluxcdbot
      messageTemplate: "{{range .Updated.Images}}{{println .}}{{end}}"
    push:
      branch: master
  update:
    path: ./${CUSTOMER_NAME}/${PROJECT_NAME}/${ENVIRONMENT_NAME}/tenants/<NS_NAME>
    strategy: Setters
```

The pathand the marker should look like below:

```
APP_VERSION: v1.20.1-356340cv1cd16eetty670di854abm467agsbn-test-<NS_NAME> # {"$imagepolicy": "<APP_NAME>:<IMAGE_POLICY_NAME>:tag"}
```

The updates are governed by marking fields to be updated in certain YAML files. For each marked field, the automation process will check the image policy name and update the field value if there is a new image matches with the policy. It means, we want the Image Automation Controller to update the selected image with the latest tag to the git repository whenever it matches the policy.

{{< notice "note" >}}

Marker is required to trigger the ImageAutomation to work.

{{< /notice >}}

# How to work with Image Watcher

Image Watcher plays an important role to make the deployment runs automatically and gives us the benefit of a more seamless process from CI (Continous Integration) to CD (Continous Deployment). Actually, by implementing Image Watcher we want to minimize manual processes that should be better if it’s automated. If the preceding process still involves a manual touch which is changing the image version directly to the manifest, after implementing Image Watcher we actually try to eliminate that manual process and let the Image Watcher does it. The diagram below may depict how it will work:

![Image Automation](/images/flux-image-watcher/4.png "Image Automation")

**Descriptions:**

*   **CI Pipeline**: Push Image

Container Image is the final output of the CI process and it will be immediately stored in Image Registry.

*   **Image Reflector**: Scan Registry

Image Reflector Controller keeps monitoring the target Image, fetches its latest metadata, and only picks the tag version.

*   **Image Automation**: Overwrite Image Tag

Image Automation Controller will then take the tag version from Image Reflector Controller and use it to replace the old image tag of the manifest that resides on the Repository.

*   **Source Controller**: Reconcile with Repo

Source Controller periodically reconciles with the Repository and the new deployment will occur eventually.

# Create Image Repository

To create an Image Repository definition, follow the command below:

```
flux create image repository <IMAGE_REPOSITORY_NAME> \
--namespace=<NAMESPACE>
--image=<IMAGE_REPOSITORY/IMAGE_NAME:TAG> \                                   
--interval=<TIME> \            
--secret-ref=<SECRET>              
--export >> <PATH/TO/SERVICE_DEPLOYMENT>
```

**Descriptions:**

*   **IMAGE\_REPOSITORY\_NAME** = the Image Repository name of each service. Example: test-website.
    
*   **NAMESPACE** = the namespace of Image Repository object will reside.
    
*   **IMAGE\_REPOSITORY/IMAGE\_NAME:TAG** = the target image of each service. Example: 12345678.dckr.ecr.us-west-2.amazonaws.com/test-website.
    
*   **TIME** = the interval at which the metadata of the defined Image Repository must be fetched. **Default**: 1m0s. Example: 1m0s, which means Image Reflector will fetch the metadata in every minute. ( The value must be in a [Go recognized duration string format](https://pkg.go.dev/time#ParseDuration) ).
    
*   **SECRET** = the name of a registry secret to be used for authentication.
    
*   **PATH/TO/SERVICE\_DEPLOYMENT** = in order to prevent a bunch of unnecessary new files, it’s better to append the Image Repository definition in each service deployment.
    

**Example output:**

```
---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageRepository
metadata:
  name: test-website
  namespace: testing
spec:
  image: 12345678.dckr.ecr.us-west-2.amazonaws.com/test-website
  interval: 1m0s
  secretRef:
    name: imagerepo-credentials
```

# Create Image Policy

To create an Image Policy definition, follow the command below:

```
flux create image policy <IMAGE_POLICY_NAME> \
--namespace=<NAMESPACE>
--image-ref=<IMAGE_REPOSITORY_REF> \
--select-semver=<SEMVER> \
--filter-regex=<REGEX> \
--filter-extract=<EXTRACT> \
--export >> <PATH/TO/SERVICE_DEPLOYMENT>

```

**Descriptions:**

*   **IMAGE\_POLICY\_NAME** = the Image Policy name of each service. Example: test-website-policy
    
*   **NAMESPACE** = the namespace of Image Policy object will reside.
    
*   **IMAGE\_REPOSITORY\_REF** = the Image Repository that Image Policy refers to. Example: test-website
    
*   **SEMVER** = a semver (semantic version) range to apply to tags. Example: >=1.0.0.
    
*   **REGEX** = a regular expression pattern used to filter the image tags. Example: ^v(?P(\\d+.)?(\\d+.)?(\*|\\d+))-\[a-fA-F0-9\]+.\*-<NS\_NAME>.
    
*   **EXTRACT** = replacement pattern (using capture groups from –filter-regex) to use for sorting. Example: $ver, take a look at the example in REGEX.
    
*   **PATH/TO/SERVICE\_DEPLOYMENT** = in order to prevent a bunch of unnecessary new files, we prefer to append the Image Policy definition in each service deployment.
    

**Example output:**

```
---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImagePolicy
metadata:
  name: test-website-policy
  namespace: testing
spec:
  imageRepositoryRef:
    name: test-website
  filterTags:
    pattern: ^v(?P<ver>(\d+\.)?(\d+\.)?(\*|\d+))-[a-fA-F0-9]+.*-testing
    extract: "$ver"
  policy:
    semver:
      range: '>=1.0.0'
```

# Create Image Update Automation

To create an Image Update Automation definition, follow the command below:

```
flux create image update <IMAGE_UPDATE_AUTOMATION_NAME> \
--namespace=<NAMESPACE>
--git-repo-ref=<REPOSITORY_REF> \
--git-repo-path=<REPOSITORY_PATH> \
--checkout-branch=<CHECKOUT_BRANCH> \
--push-branch=<PUSH_BRANCH> \
--author-name=<AUTHOR_NAME> \
--author-email=<AUTHOR_EMAIL> \
--commit-template=<MESSAGE> \
--interval=<TIME> \
--export >> <PATH/TO/SERVICE_DEPLOYMENT>
```

*   **IMAGE\_UPDATE\_AUTOMATION\_NAME** = the Image Update Automation name of each service. Example: test-website.
    
*   **NAMESPACE** = namespace the Image Update Automation object will reside.
    
*   **REPOSITORY\_REF** = the name of a GitRepository resource with details of the upstream Git repository. Example: deployments-repo.
    
*   **REPOSITORY\_PATH** = path to the directory containing the manifests to be updated. Defaults to the repository root.
    
*   **CHECKOUT\_BRANCH** = the branch to checkout. Example: master.
    
*   **PUSH\_BRANCH** = the branch to push commits to. Defaults to the checkout branch if not specified. Example: master.
    
*   **AUTHOR\_NAME** = the name to use for committing. Example: fluxcdbot.
    
*   **AUTHOR\_EMAIL** = the email to use for committing. Example: [fluxcdbot@fauzislami.com](mailto:fluxcdbot@fauzislami.com).
    
*   **MESSAGE** = a template for commit messages. Example: “{{range .Updated.Images}}{{println .}}{{end}}”.
    
*   **TIME** = source sync interval. Default: 1m0s. Example: 1m0s ( The value must be in a [Go recognized duration string format](https://pkg.go.dev/time#ParseDuration) ).
    
*   **PATH/TO/SERVICE\_DEPLOYMENT** = in order to prevent a bunch of unnecessary new files, we prefer to append the Image Update Automation definition in each service deployment.
    

**Example output:**

```
---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageUpdateAutomation
metadata:
  name: test-website
  namespace: testing
spec:
  interval: 1m0s
  sourceRef:
    kind: GitRepository
    name: deployments-repo
  git:
    checkout:
      ref:
        branch: master
    commit:
      author:
        email: fluxcdbot@fauzislami.com
        name: fluxcdbot
      messageTemplate: "{{range .Updated.Images}}{{println .}}{{end}}"
    push:
      branch: master
  update:
    path: ./${CUSTOMER_NAME}/${PROJECT_NAME}/${ENVIRONMENT_NAME}/tenants/testing
    strategy: Setters

```
