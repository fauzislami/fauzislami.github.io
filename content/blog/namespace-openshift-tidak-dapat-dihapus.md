---
title: "Namespace OpenShift Tidak Dapat Dihapus"
date: 2021-03-10
type: post
url: "/blog/2021/03/10/namespace-openshift-tidak-dapat-dihapus/"
tags: ["ScratchpadOpenshift"]
draft: false
---

Ada sebuah kejadian di project yang cukup membuat frustasi penulis ketika melakukan penghapusan sebuah project/namespace pada openshift, yaitu namespace yang akan dihapus tidak terhapus walaupun sudah dipaksa untuk dihapus dengan menggunakan parameter **–force –grace-period=0** , proses penghapusan stuck seperti gambar di bawah ini :

![Scratchpad](/images/openshift-namespace-cannot-be-deleted/1.jpeg "Scratchpad")

dan pada saat dilakukan describe namespace tersebut, stuck di status **terminating**

![Scratchpad](/images/openshift-namespace-cannot-be-deleted/2.jpeg "Scratchpad")

Setelah bergoogling-googling ria dan bertanya pada ahlinya cc : mas @alan-prasetyo , titik terang untuk menghapus mulai terlihat. Hal itu bisa terjadi karena ketika melakukan penghapusan namespace, masih terdapat objek yang belum dihapus di dalamnya. Penulis baru tersadar bahwa objek yang masih ada hanyalah **StorageCluster** .

Lakukan penghapusan namespace dengan call API. Berikut langkah-langkahnya :

1.  Get namespace status ke dalam file json

```
oc get namespace openshift-storage -o json > tmp_ns.json
```

2.  Remove kata “kubernetes” ( dibawah kata “finalizers”)

```
vi tmp_ns.json
```

3.  Buat koneksi proxy ke cluster ( jalankan di background )

```
oc proxy &
```

4.  Push isi file json yang sebelumnya dibuat ke dalam cluster dengan menggunakan curl

```
curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp_ns.json http://127.0.0.1:8001/api/v1/namespaces/openshift-storage/finalize
```

5.  Namespace seharusnya sudah terhapus, maka diperlukan untuk cek

```
oc get ns openshift-storage
```

**response : namespaces not found**

6.  Kill koneksi proxy yang sebelumnya dibuat dengan cara ketikan perintah **fg** untuk switch proses tersebut ke foreground, lalu **ctrl + c** untuk kill proses tersebut.

**Note :** Jika terdapat utilitas **jq** (JSON query), untuk langkah nomor 1 & 2 dapat diperingkas dengan command di bawah

```
oc get namespace openshift-storage -o json | jq '.spec = {"finalizers":[]}' > tmp_ns.json
```

Semoga bermanfaat.

Ref : _[https://stackoverflow.com/questions/58638297/project-deletion-struck-in-terminating](https://stackoverflow.com/questions/58638297/project-deletion-struck-in-terminating)_
