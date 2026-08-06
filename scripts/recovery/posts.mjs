export const BLOG_POSTS = [
  'blog/pod-topology-spread-constraints',
  'blog/terratest-golang-for-infrastructure-e2e-testing',
  'blog/k8s-thing-how-linux-namespace-Plays-a-role-in-Kubernetes',
  'blog/k8s-thing-how-linux-namespace-works-in-a-pod',
  'blog/fluxcd-image-watcher',
  'blog/flux-image-watcher',
  'blog/linter-aggregator-golangci-lint',
  'blog/2021/01/18/automating-k8s-cluster-installation-with-kubespray',
  'blog/2021/03/03/ci-cd-labs-part-1-integrate-jenkins-with-nexus-repository-oss',
  'blog/2021/03/05/ci-cd-labs-part-2-integrate-jenkins-with-bitbucket-server',
  'blog/2021/03/10/menambahkan-trusted-certificate-pada-jvm-di-jenkins',
  'blog/2021/03/10/namespace-openshift-tidak-dapat-dihapus',
  'blog/2021/03/10/storagecluster-ocs-tidak-dapat-dihapus',
  'blog/2021/03/20/machineconfigpool-degraded-saat-updating-error-when-evicting-pod',
  'blog/2021/03/26/ci-cd-labs-part-3-integrate-jenkins-with-openshift',
  'blog/2021/07/23/collecting-network-traffic-using-tcpdump-on-pod-level-in-openshift',
  'blog/2021/08/01/service-mesh-istio-and-kiali-setup',
  'blog/2021/09/26/secure-k8s-secret-object-using-sealedsecret',
  'blog/2021/10/08/proxying-pypi-repository-in-nexus-repository-manager',
  'blog/2021/10/14/proxying-docker-registry-through-nexus-repository-manager',
  'blog/2021/10/17/highly-available-kubernetes-cluster-with-haproxy-and-keepalived',
  'blog/2022/02/06/immutable-infrastructure-treating-servers-like-cattle-does-it-sound-ridiculous',
  'blog/2022/02/18/jcasc-jenkins-configuration-as-code-setting-up-jenkins-in-a-fully-reproducible-way',
];

export const THOUGHTS_POSTS = [
  'thoughts/trade-off',
  'thoughts/daring-echo',
  'thoughts/generational-dispute',
  'thoughts/upon-midst-of-war',
  'thoughts/pewaris-atau-perintis',
];

// Fallback for posts with no .post-date AND no real RSS <pubDate> — see spec.md.
export const DATE_FALLBACK = {
  'thoughts/trade-off': '2021-09-27',
  'thoughts/daring-echo': '2024-02-26',
};
