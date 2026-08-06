---
title: "Terratest: Introduction to Automation Test For Infrastructure-as-Code"
date: 2022-08-07
type: post
url: "/blog/terratest-golang-for-infrastructure-e2e-testing/"
tags: ["Terratest", "Terraform"]
draft: false
---

{{< notice "note" >}}

**Disclaimer:** I’m not a Golang developer 😄

{{< /notice >}}

![Terratest logo](/images/intro-terratest/2.png "Terratest logo")

### Treating Infrastructure as a Product

Setting up infrastructure could be a tedious tasks nowadays. The reason is there will be some more steps to do the same thing on the different environment. Imagine that there are needs to deploy multiple kubernetes cluster with different specification into different kind of environment as well. Meaning that a lot of provisioning, a bunch of configuration, and don’t forget about assuring all of those stuff are deployed properly. Infrastructure-as-Code a.k.a IaC paradigm has emerged to overcome that laborious situation by defining the infrastucture-related stuff into lines of code and enabling various advantages starting from how to provision to how to recover from disaster recovery. IaC is very beneficial for engineers who work with infrastructure. As of this writing, there is a bunch of tools for implementing IaC such as Terraform, Ansible, Packer, Chef, etc.

There is no problem with IaC until a question crosses engineer’s mind like “if infrastructure is defined into codes, shouldn’t it be tested prior to considering them as well-prepared deployment or even production-ready?”. Like codes during the software development is mandatory to pass some particular criterias before being shipped to users in order to guarantee code quality, the code that defines infrastructure is supposed to be passed for some criterias as well prior to considering them as deliverable stuff.

Repetitive work is exhausting even painful if it happens for so long. Fortunately, there are tools that enable us to define our infrastructure in a high-level language and get rid of manual infrastructure deployment and maintenance. Okay, that’s not a problem anymore today but how about testing? It seems like we need to treat infrastructure as a product alike by guaranteeing it could work properly as intended prior to be a production-ready product. Hence, we will get another manual work for testing or verifying what automation provisioner tools have done whether the generated infrastructure is matching our expectations or not. These tasks often take times and include many manual steps. In order to do so, we’re able to use web console, command line or SDK (if any). For instance, it’s possible to happen we meet a condition where we have to directly connect to a machine to test whether some services are up, some files are present, some ports are open, and so on. Those parts are really causing real pain for us if we do that repetitively to many instances.

Starting from that problem, we may need some helps from any tools to automate the process. Like any common tools for code testing in terms of quality and functionality in software development, we need that sort of things for infrastructure as well. Is there any? the answer is **YES**, as it’s really possible and makes sense if we want to automate the infrastructure testing. We need to have a look at [**Terratest**](https://terratest.gruntwork.io/) which makes that kind of automation is doable. Probably, Terratest is not the one and only tool for enabling automation testing in infrastructure but as of this writing, I only recognize Terratest and in this post, I’ll be bringing up a topic about Terratest.

### What is Terratest?

So, what is Terratest in more detail? Quoted from its official doc ([https://terratest.gruntwork.io/)](https://terratest.gruntwork.io/\)):

> Terratest is a Go library that provides patterns and helper functions for testing infrastructure, with 1st-class support for Terraform, Packer, Docker, Kubernetes, AWS, GCP, and more.

In short, Terratest is written in Golang which provides pattern and code functions to help us to create and then automate the test flow for our infrastructure code written in Terraform, Packer and Docker for image creator, and also for verifying our deployment in kubernetes cluster. Sounds interesting, right?

### Benefits of Using Terratest

Testing our infrastructure code with a library like Terratest provides some advantages for us as the ops guy. Here is the benefit list:

*   No need manual work for testing
*   Infrastructure is well-documented
*   Fast feedback loop that provides efficient bug fixing
*   Ensure resilience when modifying or upgrading resources
*   It provides variety of helper functions and patterns for common infrastructure testing

Probably, there are still some advantages I don’t mention above but what no more less important is Terratest may not have all built-in helper functions we need but obviously we can create our own to fit our case. For instance, if we want to get a specific HostedZone ID in AWS Route53 and that will be an object to test as well, we might want to use AWS SDK to fetch that ID and invoke in the test case.

### Terratest in 4 steps

![Terratest flow](/images/intro-terratest/1.png "Terratest flow")

As we can see from the picture above, generally it only needs 4 steps to get the things done.

1.  We have to create a test file with the suffix `_test.go` in the first place (since it’s a convention format for test file in Golang). Before starting to create a test file, it would be better if we break down what we want it to pass any criterias during the test by creating test cases in sequence.
2.  After everything looks good and ready to run, we’re good to go. Terratest will handle the process of deploying real infrastructure by using the resources we have defined (Terraform files, helmchart, dockerfile, etc)
3.  Once those resources are up and running, Terratest will validate the infrastructure to assure they work properly as intended.
4.  As the final step, Terratest will do some clean-up immediately by tearing down all of the recently deployed resources. Therefore, we don’t have to worry about being charged for unncessary resource running for a long time.

### Terratest in Action

I’ll be only bring Terraform to work along with Terratest, given Terraform is one of the most popular tool that enables codifying infrastructure. Let’s make it simple for us to easily get better understanding what Terratest really does. I have a simple Terraform codes that will handle EC2 instance deployment. It consists of a few configurations to have a web server out of the box. Terratest will take that module as an object to be tested by deploying, testing and tearing it down all in one go. If you want to try this and follow along, you can visit the original works [**here**](https://github.com/fauzislami/lab-terratest).

First thing first, I’ll break down what I want to achieve on the test. Here are the test cases:

*   Since this module has the main purpose to deploy a web server within EC2 instance, I want Terratest to assure me the web server is up and running well. Hence, I’ll tell Terratest to make an HTTP request to the web server.
*   This module is composed of some other AWS resources such as VPC, Subnet, Routing Table, and Internet Gateway. So, I want Terratest to assure me that all of those resources are created.

There are only two test cases that is required to be passed but especially for checking VPC, Subnet, Routing Table, and Internet Gateway will be in a separate test case. Here I’m going to elaborate chunk of codes that have essential function for Terratest.

1.  Import Library

This block is composed of libraries that will be used.

```go
import (
	"fmt"
	"testing"
	"time"

	http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
	"github.com/gruntwork-io/terratest/modules/terraform"
)
```

Here there are 5 libraries I’m going to use but _testing_, _http-helper_ and _terraform_ play the essential role during the test. I won’t explain more about what exactly they are but what they do is simply to establish connection to the cloud provider, read, deploy and then test the deployment based on test cases.

2.  Function

This function contains full of codes to execute the test.

```go
func TestTerraformEC2WebserverExample(t *testing.T) {
//code here
}
```

Go doesn’t have main function in test, so we could just create some other functions related to the test or additional helper functions. For now, I will only utilize built-in helper functions from the libraries declared above and only create one function for the test.

3.  Terraform Init and Apply

If we want to initialize and apply Terraform, we have to type commands like _terraform init_ and _terraform apply_ manually in our machine. This code below will do exactly the same way like we do it manually.

```go
	// the values to pass into the module
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{

		// the path where the module is located
		TerraformDir: "../ec2-webserver",

		// variables to pass to the module using -var options
		Vars: map[string]interface{}{
			"region": "us-east-2",
		},
	})

	// run a Terraform Init and Apply with the terraform options
	terraform.InitAndApply(t, terraformOptions)

	// run a Terraform Destroy at the end of the test
	defer terraform.Destroy(t, terraformOptions)
```

at that part, Terratest will init and apply Terraform codes on the defined directory path and use the defined variable to pass into the module. At the end of the test, all of previously created resources will be torn down (see: [defer](https://go.dev/tour/flowcontrol/12))

{{< notice "note" >}}

Terratest takes variable as mandatory requirement if it has no default value.

{{< /notice >}}

4.  Fetch The Value

It’s common during the test to fetch certain value, compare it with the desired value and evaluate the result. Should be passed if it meets the desired value and should be failed if it doesn’t.

```go

	publicDNS := terraform.Output(t, terraformOptions, "instance_app-server1_public_dns")

	url := fmt.Sprint(publicDNS)

```

I create new variable named _publicDNS_ for storing the output from Terraform once the provision process is done and print it by a variable named _url_.

5.  Test Cases

I break down the test into 5 cases which essentiall will evaluate the result.

```go
	http_helper.HttpGetWithRetry(t, "http://"+url, nil, 200, "This is a terraform module for EC2", 15, 10*time.Second)
	terraform.OutputRequired(t, terraformOptions, "vpn_id")
	terraform.OutputRequired(t, terraformOptions, "subnet_id")
	terraform.OutputRequired(t, terraformOptions, "route_table_id")
	terraform.OutputRequired(t, terraformOptions, "gateway_id")
```

What we see on the above is really basic for doing testing but we also could add more comprehensive test like using [suite](https://pkg.go.dev/github.com/stretchr/testify/suite). Again, for this introduction let’s make it simple and probably, in other occasion, it’s interesting to get a bit more advance testing with Terratest.

Those codes are all combined in a function called _TestTerraformEC2WebserverExample_ and below is the full code:

```go
package test

import (
	"fmt"
	"testing"
	"time"

	http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
	"github.com/gruntwork-io/terratest/modules/terraform"
)

func TestTerraformEC2WebserverExample(t *testing.T) {

	// the values to pass into the module
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{

		// the path where the module is located
		TerraformDir: "../ec2-webserver",

		// variables to pass to the module using -var options
		Vars: map[string]interface{}{
			"region": "us-east-2",
		},
	})

	// run a Terraform Init and Apply with the terraform options
	terraform.InitAndApply(t, terraformOptions)

	// run a Terraform Destroy at the end of the test
	defer terraform.Destroy(t, terraformOptions)

	publicDNS := terraform.Output(t, terraformOptions, "instance_app-server1_public_dns")

	url := fmt.Sprint(publicDNS)

	http_helper.HttpGetWithRetry(t, "http://"+url, nil, 200, "This is a terraform module for EC2", 15, 10*time.Second)
	terraform.OutputRequired(t, terraformOptions, "vpn_id")
	terraform.OutputRequired(t, terraformOptions, "subnet_id")
	terraform.OutputRequired(t, terraformOptions, "route_table_id")
	terraform.OutputRequired(t, terraformOptions, "gateway_id")

}
```

Let’s execute the test! Simply by going to the directory where test file exists and running this command:

```bash
go test
```

See what it does:

```go
➜  test git:(master) ✗ go test
TestTerraformEC2WebserverExample 2022-11-20T11:42:38+07:00 retry.go:91: terraform [init -upgrade=false]
TestTerraformEC2WebserverExample 2022-11-20T11:42:38+07:00 logger.go:66: Running command terraform with args [init -upgrade=false]
TestTerraformEC2WebserverExample 2022-11-20T11:42:39+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:39+07:00 logger.go:66: Initializing the backend...
TestTerraformEC2WebserverExample 2022-11-20T11:42:39+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:39+07:00 logger.go:66: Initializing provider plugins...
TestTerraformEC2WebserverExample 2022-11-20T11:42:39+07:00 logger.go:66: - Reusing previous version of hashicorp/aws from the dependency lock file
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: - Using previously-installed hashicorp/aws v4.20.1
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: Terraform has been successfully initialized!
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: You may now begin working with Terraform. Try running "terraform plan" to see
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: any changes that are required for your infrastructure. All Terraform commands
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: should now work.
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: If you ever set or change modules or backend configuration for Terraform,
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: rerun this command to reinitialize your working directory. If you forget, other
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: commands will detect it and remind you to do so if necessary.
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 retry.go:91: terraform [apply -input=false -auto-approve -var region=us-east-2 -lock=false]
TestTerraformEC2WebserverExample 2022-11-20T11:42:41+07:00 logger.go:66: Running command terraform with args [apply -input=false -auto-approve -var region=us-east-2 -lock=false]
TestTerraformEC2WebserverExample 2022-11-20T11:42:46+07:00 logger.go:66: data.aws_ami.amazon_ami: Reading...
TestTerraformEC2WebserverExample 2022-11-20T11:42:46+07:00 logger.go:66: data.aws_ami.amazon_ami: Read complete after 1s [id=ami-07251f912d2a831a3]
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66: Terraform used the selected providers to generate the following execution
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66: plan. Resource actions are indicated with the following symbols:
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66:   + create
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66: Terraform will perform the following actions:
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66:   # aws_instance.webserver will be created
TestTerraformEC2WebserverExample 2022-11-20T11:42:47+07:00 logger.go:66:   + resource "aws_instance" "webserver" {
------------
omitted outputs for Terraform Init and Apply
------------
TestTerraformEC2WebserverExample 2022-11-20T11:51:19+07:00 http_helper.go:59: Making an HTTP GET call to URL http://ec2-18-117-74-249.us-east-2.compute.amazonaws.com
TestTerraformEC2WebserverExample 2022-11-20T11:51:20+07:00 retry.go:91: terraform [output -no-color -json vpn_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:20+07:00 logger.go:66: Running command terraform with args [output -no-color -json vpn_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:21+07:00 logger.go:66: "vpc-0968aaebfccd370e2"
TestTerraformEC2WebserverExample 2022-11-20T11:51:21+07:00 retry.go:91: terraform [output -no-color -json subnet_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:21+07:00 logger.go:66: Running command terraform with args [output -no-color -json subnet_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:22+07:00 logger.go:66: "subnet-0f661e865b58f0538"
TestTerraformEC2WebserverExample 2022-11-20T11:51:22+07:00 retry.go:91: terraform [output -no-color -json route_table_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:22+07:00 logger.go:66: Running command terraform with args [output -no-color -json route_table_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:23+07:00 logger.go:66: "rtb-0636e0d4ce1bcc924"
TestTerraformEC2WebserverExample 2022-11-20T11:51:23+07:00 retry.go:91: terraform [output -no-color -json gateway_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:23+07:00 logger.go:66: Running command terraform with args [output -no-color -json gateway_id]
TestTerraformEC2WebserverExample 2022-11-20T11:51:24+07:00 logger.go:66: "igw-0ba53c4671a1e8cde"
TestTerraformEC2WebserverExample 2022-11-20T11:51:24+07:00 retry.go:91: terraform [destroy -auto-approve -input=false -var region=us-east-2 -lock=false]
TestTerraformEC2WebserverExample 2022-11-20T11:51:24+07:00 logger.go:66: Running command terraform with args [destroy -auto-approve -input=false -var region=us-east-2 -lock=false]
TestTerraformEC2WebserverExample 2022-11-20T11:51:29+07:00 logger.go:66: aws_vpc.vpc1: Refreshing state... [id=vpc-0968aaebfccd370e2]
TestTerraformEC2WebserverExample 2022-11-20T11:51:29+07:00 logger.go:66: data.aws_ami.amazon_ami: Reading...
TestTerraformEC2WebserverExample 2022-11-20T11:51:30+07:00 logger.go:66: data.aws_ami.amazon_ami: Read complete after 1s [id=ami-07251f912d2a831a3]
TestTerraformEC2WebserverExample 2022-11-20T11:51:33+07:00 logger.go:66: aws_internet_gateway.this-igw: Refreshing state... [id=igw-0ba53c4671a1e8cde]
TestTerraformEC2WebserverExample 2022-11-20T11:51:33+07:00 logger.go:66: aws_route_table.this-rt: Refreshing state... [id=rtb-0636e0d4ce1bcc924]
TestTerraformEC2WebserverExample 2022-11-20T11:51:33+07:00 logger.go:66: aws_subnet.private1: Refreshing state... [id=subnet-0f661e865b58f0538]
TestTerraformEC2WebserverExample 2022-11-20T11:51:33+07:00 logger.go:66: aws_security_group.http-sg: Refreshing state... [id=sg-04440217a7f591906]
TestTerraformEC2WebserverExample 2022-11-20T11:51:33+07:00 logger.go:66: aws_route.internet-route: Refreshing state... [id=r-rtb-0636e0d4ce1bcc9241080289494]
TestTerraformEC2WebserverExample 2022-11-20T11:51:34+07:00 logger.go:66: aws_route_table_association.private1: Refreshing state... [id=rtbassoc-011e9e17139dc9e7a]
TestTerraformEC2WebserverExample 2022-11-20T11:51:34+07:00 logger.go:66: aws_instance.webserver: Refreshing state... [id=i-0a92f37e5ebc4e97e]
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66: Terraform used the selected providers to generate the following execution
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66: plan. Resource actions are indicated with the following symbols:
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66:   - destroy
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66: Terraform will perform the following actions:
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66:   # aws_instance.webserver will be destroyed
TestTerraformEC2WebserverExample 2022-11-20T11:51:37+07:00 logger.go:66:   - resource "aws_instance" "webserver" {
------------
omitted outputs for test cases and Terraform destroy
------------
TestTerraformEC2WebserverExample 2022-11-20T11:52:17+07:00 logger.go:66: aws_subnet.private1: Destruction complete after 1s
TestTerraformEC2WebserverExample 2022-11-20T11:52:18+07:00 logger.go:66: aws_security_group.http-sg: Destruction complete after 1s
TestTerraformEC2WebserverExample 2022-11-20T11:52:18+07:00 logger.go:66: aws_vpc.vpc1: Destroying... [id=vpc-0968aaebfccd370e2]
TestTerraformEC2WebserverExample 2022-11-20T11:52:18+07:00 logger.go:66: aws_vpc.vpc1: Destruction complete after 1s
TestTerraformEC2WebserverExample 2022-11-20T11:52:18+07:00 logger.go:66: 
TestTerraformEC2WebserverExample 2022-11-20T11:52:18+07:00 logger.go:66: Destroy complete! Resources: 8 destroyed.
TestTerraformEC2WebserverExample 2022-11-20T11:52:18+07:00 logger.go:66: 
PASS
ok      test    234.284s
```

From the log above, Terratest tells Terraform to do initialization and apply the TF files. Once all resources are created successfully, it will then verify/test the real state with the desired state by referring to the test cases and if it passess all the test cases, then Terratest instructs Terraform to destroy all previously created resources and the process is finished 😄

Yup! We have reached the end of this post 🎉 I hope this post is worth your time, cheers! 🥂
