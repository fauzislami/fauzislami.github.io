---
title: "Securing K8S Secret Object Using SealedSecret"
date: 2021-09-26
type: post
url: "/blog/2021/09/26/secure-k8s-secret-object-using-sealedsecret/"
tags: ["Kubernetes", "SealedSecret"]
draft: false
---

![Scratchpad](/images/sealed-secret/1.png "Scratchpad")

Managing kubernetes manifest on Git or any other SCM is a common task nowadays. It makes life easier if we talk about continuous deployment. However, there is a manifest that should not be stored on SCM, it’s secret object. Secret object on Kubernetes was made to hide any sensitive data including user credentials and key. Unfortunately, secret object is not completely secure, it does not encrypt but only uses base64 encoding scheme to hide the data and it can be easily decoded. Therefore, Sealed Secret is one of the solution to make the secret more secure and can be securely stored on SCM.

### **What is Secret Object ?**

> A secret is an object that contains a small amount of sensitive data such as a password, certificate, a token, or a key.

Source : [https://kubernetes.io/docs/concepts/configuration/secret/](https://kubernetes.io/docs/concepts/configuration/secret/)

### **How Secret Works**

![Scratchpad](/images/sealed-secret/2.png "Scratchpad")

It decouples any confidential data from application code. Besides, it will be reusable for other resources. So, any confidential data is not embedded on the pod itself, it will make easier to maintain if there are some changes regarding the data on secret.

### **The Concern of Managing Secret Manifest**

Secret Object is not as secret as it supposed to be. We manage all of the configurations of K8S cluster in a shared git repository, run automated tests, and automatically deploy changes to the cluster from master except **_Secret_**. Because it only contains encrypted encoded data. Take a look on the picture below:

![Scratchpad](/images/sealed-secret/3.png "Scratchpad")

As we can see on the picture above, it only contains encoded data. We can simply decode that encoded data into readable data / plaintext by using a simple command like above. So, it’s not completely secure. What we’re going to do is how to make it more secure rather than only encoding the data. The only possible way is encryption, because to return the original data we need a file called private key which should be hidden somewhere and just a particular entity/person who knows it. But some concerns we need to consider before doing that are:

1.  **Secure the secret object**  
    The data on secret object must be secured and not easily obtained.
2.  **Possible to store in shared git repository safely**  
    Must be manageable and stored in SCM safely
3.  **Secret object remains reusable for other resources**  
    Still reusable to be used by other deployment
4.  **Secret object should work as usual in cluster**  
    The most important one is able to work like usual in the cluster. The previous points will be useless if it can’t be used.

### **Secure K8S Secret** **Object Using SealedSecret**

Encrypt your Secret into a SealedSecret. **SealedSecrets** is a kubernetes controller that is developed by bitnami-labs which has a purpose to make a **one-way encrypted Secret** that can be created by anyone, but can **only** be decrypted by the controller running in the target cluster. The Sealed Secret is safe to share publicly, including to public git repository.

![Scratchpad](/images/sealed-secret/4.png "Scratchpad")

SealedSecret works as a controller and a CRD called **SealedSecret** on the cluster. The picture above depicts how SealedSecret encrypts a Secret manifest file and generates SealedSecret manifest file. After the manifest file already exist, it would be safe to store it to SCM such as GitHub. Then, whenever we need to deploy an application which requires the data contained by the secret object, we should simply deploy SealedSecret manifest to cluster and let SealedSecret controller takes the control to decrypt the data then creates secret object when decryption is done. So, it’s still only secret object that will be accessed by the application, not SealedSecret object.

### **SealedSecret Component**

The SealedSecretimplementation consists of two components:

1.  A controller that runs in-cluster, and implements a new SealedSecret Kubernetes API object via the **third party resource** mechanism.
2.  A _kubeseal_ command line tool that encrypts a regular Kubernetes Secret object (as YAML or JSON) into a SealedSecret.

### **How to use SealedSecret**

There are two possible ways to use SealedSecret based on the condition below.

1.  Having access to cluster

![Scratchpad](/images/sealed-secret/5.png "Scratchpad")

Kubeseal require connection to cluster by default. So, whenever we have an access to cluster, we could use it right away.

2.  Not have any access to cluster

![Scratchpad](/images/sealed-secret/6.png "Scratchpad")

In some cases we don’t have any access to cluster but don’t worry, we still have a way to create SealedSecret. But it requires a public key from the controller and once again, we don’t have any access to cluster but we can ask kubernetes administrator to fetch the public key from SealedSecret controller. Public key is necessary because we use it to encrypt the secret manifest.

### **SealedSecret Scopes**

SealedSecret has 3 scopes in order to make boundaries and certain rules.

There are 3 scopes we can create our SealedSecrets with :

1.  **Strict** (default) : In this case, we need to seal our Secret considering the name and the namespace. We can’t change the name and the namespaces of SealedSecret once we have created it. If we try to do that, we get a decryption error.
2.  **Namespace-wide**: This scope allows us to freely rename the SealedSecret within the namespace for which we have sealed the Secret.
3.  **Cluster-wide** : This scope allows us to freely move the Secret to any namespace and give it any name we wish.

After reading all these explanation which might be quite boring, why don’t we give it a try?

To make easier to follow along, I have created a video that cover this labs. So if you want to follow along, feel free to watch the video. I use bahasa (indonesian language) on that video.

### **Installations**

**Cluster Side**

We can deploy the controller either by applying manifest or using helm :

*   Applying Manifest

```
$ kubectl apply -f https://github.com/bitnami-labs/sealedsecrets/releases/download/v0.16.0/controller.yaml
```

*   Using Helm

```
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm install -n kube-system demo-sealed-secrets sealed-secrets/sealed-secrets
```

**Client Side**

In this step we’re going to install kubeseal CLI.

```
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.16.0/kubeseal-linux-amd64 -O kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

### **Secret Object Creation**

*   Create Secret #1

```
kubectl create secret generic dummy-auth \
  --from-literal=user=admin \
  --from-literal=password=admin123 \
  --dry-run=client -o yaml > dummy-auth.yaml
```

*   Create Secret #2

```
kubectl create secret generic db-auth \
  --from-literal=user=dbadmin \
  --from-literal=password=dbadmin123 \
  --dry-run=client -o yaml > db-auth.yaml
```

### **SealedSecret Creation (Need access to the cluster)**

*   Encrypt secret using SealedSecret

```
kubeseal --format=yaml --controller-namespace=kube-system \
  --controller-name=sealed-secrets-controller &lt; dummy-auth.yaml \
  > sealed-dummy-auth.yaml
```

*   Apply SealedSecret Manifest

```
kubectl apply -f sealed-dummy-auth.yaml
kubectl get secret
kubectl get sealedsecret
```

### **SealedSecret Creation (NO Need access to the cluster)**

*   Fetch public key ( Only if public key doesn’t exist )

```
kubeseal --fetch-cert --controller-namespace=kube-system \
  --controller-name=sealed-secrets-controller > sealedsecret-pubkey.pem
```

*   Encrypt secret using SealedSecret and Apply it

```
kubeseal --format=yaml \
  --cert=sealedsecret-pubkey.pem < db-auth.yaml > sealed-db-auth.yaml

kubectl apply -f sealed-db-auth.yaml
```

### **Compare strict with cluster-wide**

*   Change SealedSecret name (Strict)

Do a modification to sealed-db-auth.yaml file → Name: db-auth —> Name: db-auth-2

Then re-apply

```
kubectl apply -f sealed-db-auth.yaml
```

SealedSecret object should be created but Secret object not. It is because we use strict mode for the scope of SealedSecret. Therefore, any modification would be prohibited.

*   Change SealedSecret name (Cluster-Wide)

Recreate sealed-db-auth.yaml to make it using cluster-wide as its scope.

```
kubeseal --scope=cluster-wide \
  --format=yaml --cert=sealedsecret-pubkey.pem < \
  db-auth.yaml > sealed-db-auth.yaml
```

Do a modification to sealed-db-auth.yaml file → Name: db-auth —> Name: db-auth-2

```
kubectl apply -f sealed-db-auth.yaml
```

See what happen, SealedSecret object should be created and Secret object as well. It works like a charm!

I hope it will be useful. Thanks !
