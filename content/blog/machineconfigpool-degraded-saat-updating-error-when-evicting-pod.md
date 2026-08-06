---
title: "MachineConfigPool degraded saat updating : “Error when evicting pod”"
date: 2021-03-20
type: post
url: "/blog/2021/03/20/machineconfigpool-degraded-saat-updating-error-when-evicting-pod/"
tags: ["ScratchpadOpenshift"]
draft: false
---

![Scratchpad](/images/machineconfigpool-issue/1.png "Scratchpad")

Kejadian ini seringkali terjadi ketika melakukan sebuah perubahan cluster yang mengharuskan setiap nodes pada cluster konsolidasi dengan perubahan yang baru saja diterapkan. Pada masalah yang penulis alami, penulis ingin menambahkan private registry ke dalam cluster agar bisa dikenali sebagai insecure registry. Namun setelah selesai dikonfigurasi dan cluster otomatis melakukan konsolidasi konfigurasi ke setiap nodes (menambahkan insecure registry), terdapat suatu hal yang janggal ketika melihat kondisi salah satu node stuck di status **_“Ready,SchedulingDisabled_“** dengan waktu yang lama dan tidak normal. Setelah dilakukan pengecekan pada node ternyata terdapat 1 pod yang bermasalah yang tidak bisa dihapus dari node tersebut :

```
Last Transition Time:  2021-03-17T07:03:57Z
Message:               Node storage-1.dev.example.go.id is reporting: "failed to drain node (5 tries): timed out waiting for the condition: error when evicting pod \"rook-ceph-osd-0-7cbdc4d676-5xjgp\": global timeout reached: 1m30s"
Reason:                1 nodes are reporting degraded status on sync
Status:                True              True
```

Masalah ini diperjelas dengan MCP yang terlihat terdapat 1 node berstatus **_degraded_** :

```
NAME     CONFIG                                             UPDATED   UPDATING   DEGRADED   MACHINECOUNT   READYMACHINECOUNT   UPDATEDMACHINECOUNT   DEGRADEDMACHINECOUNT   AGE
master   rendered-master-5ec33290c470c64d0592f4ca1eab9991   True      False      False      3              3                   3                     0                      88d
worker   rendered-worker-f8b64999b0def1083501ba286c701aab   False     True       True       22             2                   2                     1                      88d
```

Setelah dicari tahu akar permasalahannya adalah ketika node tersebut melakukan penyesuaian konfigurasi yang baru, maka akan ada saatnya node tersebut harus dilakukan restart secara otomatis. Namun sebelum node tersebut restart, maka pod yang berjalan di atasnya akan dipindahkan ke node yang lain. Uniknya pod ini tidak bisa dipindahkan karena pada PDB ( Pod Disruption Budget ) konfigurasi **_maxUnavailable_** nya adalah 0, yang dimana artinya adalah pod tersebut tidak bisa dimatikan karena ketidaktersediaan maksimumnya adalah tidak ada alias nol, karena pada saat pemindahan pod, pod tersebut akan di-_terminate_ terlebih dahulu. Sebuah PDB membatasi jumlah Pod yang boleh mati secara bersamaan pada aplikasi yang direplikasi dikarenakan disrupsi yang disengaja. Misalnya, sebuah aplikasi yang bekerja secara _quorum_ mau memastikan bahwa jumlah replika yang berjalan tidak jatuh ke bawah yang dibutuhkan untuk membentuk sebuah _quorum_. Maka dari itu perlu ketidaktersediaan maksimumnya lebih dari 0. Disini penulis set parameter **_maxUnavailable_** menjadi 3, dengan cara di bawah ini :

```
oc patch pdb <pdb_name> -n <project_name> --type=merge -p '{"spec":{"maxUnavailable":3}}''
```

Setelah perintah di atas dilakukan maka pod seharusnya berhasil terminated dan MCP akan kembali melakukan update.

Semoga bermanfaat.

**_Ref_** : [https://access.redhat.com/solutions/5838671](https://access.redhat.com/solutions/5838671)
