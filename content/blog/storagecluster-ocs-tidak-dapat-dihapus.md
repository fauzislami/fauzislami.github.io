---
title: "StorageCluster OCS tidak dapat dihapus"
date: 2021-03-10
type: post
url: "/blog/2021/03/10/storagecluster-ocs-tidak-dapat-dihapus/"
tags: ["ScratchpadOpenshift"]
draft: false
---

Ada kalanya keanehan terjadi ketika sedang mengerjakan tasks di project. Salah satu hal aneh tersebut yang penulis adalah menghapus sebuah objek yang tidak berhasil terhapus tanpa alasan yang diketahui sampai saat ini oleh penulis.

![Scratchpad](/images/cannot-delete-storagecluster/1.jpeg "Scratchpad")

Setelah mencari-cari tahu cara menghapusnya secara paksa, cukup melakukan patch secara manual

```
oc patch -n openshift-storage storagecluster/ocs-storagecluster --type=merge -p '{"metadata": {"finalizers":null}}'
```

Pada command di atas , terlihat jelas **finalizers** dibuat valuenya menjadi **null**. Namun sebenarnya, sebelum mengeksekusi command tersebut penulis mencoba untuk melakukannya dengan mengedit **StorageCluster** tersebut secara manual dengan menggunakan perintah _oc edit storagecluster ocs-storagecluster_, lalu merubah value pada key **finalizers** menjajdi **null**, namun ketika konfigurasi tersebut disimpan tidak terjadi apa-apa dan StorageCluster tetap stuck pada status **Deleting**. Lalu setelah, barulah solusi di atas dieksekusi dan StorageCluster berhasil dihapus.

Semoga bermanfaat.
