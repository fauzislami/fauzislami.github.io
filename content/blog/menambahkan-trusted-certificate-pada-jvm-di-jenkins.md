---
title: "Menambahkan Trusted Certificate Pada JVM di Jenkins"
date: 2021-03-10
type: post
url: "/blog/2021/03/10/menambahkan-trusted-certificate-pada-jvm-di-jenkins/"
tags: ["ScratchpadJenkins"]
draft: false
---

![Scratchpad](/images/add-trusted-certificate-in-jvm/1.png "Scratchpad")

Pada tulisan ini membahas sebuah kendala yang dialami penulis ketika melakukan integrasi Jenkins dengan Jira, Bitbucket dan Nexus yang menggunakan HTTPS sebagai protokolnya. Pada saat melakukan test connection terdapat error : **_“_**\_ **unable to find valid certification path to requested target jenkins**\_ “

Error itu berasal JVM ( Java Virtual Machine ). Ini karena environment pada Java tidak mempunyai informasi tentang HTTPS server yang ada pada Jira, Bitbucket dan Nexus tersebut untuk dilakukan verifikasi apakah itu merupakan website valid atau tidak. Biasanya sertifikat dapat diperoleh dari internal Root CA atau secara Self-Signed dan hal ini yang biasanya seolah membuat JVM bingung karena tidak satupun yang masuk “trusted list” nya. Oleh karena itu kita perlu melakukan import sertifikat secara manual pada JVM. Dengan begitu, artinya kita memberitahu JVM bahwa sertifikat tersebut terpercaya.

Disini penulis mendokumentasikan cara bagaimana mendapatkan sertifikat nexus yang menggunakan HTTPS menggunakan openssl dan kemudian melakukan import sertifikat tersebut secara manual menggunakan keytool. Berikut adalah langkah-langkahnya :

1.  Download sertifikat dari server

```
openssl s_client -showcerts -connect 192.168.1.116:5000 < /dev/null 2>; /dev/null | openssl x509 -outform PEM > nexus_ca.pem
```

2.  Lihat isi sertifikat

```
root@jenkins ~]# cat nexus_ca.pem
-----BEGIN CERTIFICATE-----
MIIDGTCCAgGgAwIBAgIUI9Z5Ai/s58ly7rtT9dOQvjsyIm8wDQYJKoZIhvcNAQEL
BQAwHDEaMBgGA1UEAwwRbmV4dXMuZXhhbXBsZS5jb20wHhcNMjEwMjAzMTIzNzI2
WhcNMzEwMjAxMTIzNzI2WjAcMRowGAYDVQQDDBFuZXh1cy5leGFtcGxlLmNvbTCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANGSO3TjoD9hMz0JNF6UPbSS
fw5gIhiM/7g3g5Sw4JQqsKMJKiJudWYggZizTkAziMnB+WxmPkADzXI6P8d96SB5
my17fWj6Xf1BylylyCEPQ8OxC4wSkLu3av8YM7wzRMX75jys+jm8GMuihkiakRt2
v/dNA9c3q66vBub0XOn2PjHv4wmWq4CtGrifazFeB50/ftPrtDQ1Sqfxz99VUob5
154ybH8AcOYBVC01VZTv38NSt8KfmHj+01ogkRRWUlxdbacEiosfwfAV1FvVuK3X
To+kSboPSLLEKj3VGRGAoB+BzsuYf5eTq/jFyUS+1KIc9vrgbMLCFe8o8VUDAGkC
AwEAAaNTMFEwHQYDVR0OBBYEFBaETNhchQOXaunjBw5xY0Xcbc2DMB8GA1UdIwQY
MBaAFBaETNhchQOXaunjBw5xY0Xcbc2DMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADggEBAIKx1FwES8krn1H4tSVAvz4lXyw5l/4y621hvOzuXuMvBfyS
1pCKpdU9UFokS7AN7UoA76DN86JyG++BOa2qpf4BgAHg/nwuaip32CARVhIUO2v2
iNUPRCcq6835EpbfmivMpExFmieAzIXjn5Tk+tZyPPH3VFlE0dfQ5FPhxbBkpJxi
pl4d4vhFusot0LzFGfK2dGBsqfRDW6v9cJtdgqpNvjPCZbiymhsizFGH9dl+23Ze
oQSJjVtnxIVLMqi+sviLRXdGOBg7Iu6Ft2+o8h8BNstHRy3LD9Y/UGrHHD7Or9Zs
a5fr35HoQceKhNWPLIqq0Fefm/xlXQymYYnZFXU=
-----END CERTIFICATE-----
```

3.  Import sertifikat ke keystore pada JRE

```
keytool -importcert -file nexus_ca.pem -keystore $JAVA_HOME/jre/lib/security/cacerts -alias "Nexus"
```

Kemudian setelah dieksekusi maka akan diminta memasukan password. Berhubung passwordnya masih default, maka penulis input password default dari cacerts tersebut, yakni **changeit**

Setelah itu keluar output seperti ini :

```
Owner: CN=nexus.example.com
Issuer: CN=nexus.example.com
Serial number: 23d679022fece7c972eebb53f5d390be3b32226f
Valid from: Wed Feb 03 19:37:26 WIB 2021 until: Sat Feb 01 19:37:26 WIB 2031
Certificate fingerprints:
         MD5:  CA:8D:5B:E3:A6:02:CF:0F:CE:99:78:B0:54:32:D7:A9
         SHA1: 5D:CF:9E:FD:33:FD:75:F3:01:59:6E:B1:1F:A5:CC:DF:D7:EC:F6:31
         SHA256: C0:66:22:D1:F3:A7:DE:A9:60:88:4E:F7:47:C4:20:DE:88:0C:38:07:62:02:0D:FA:6C:FD:4E:9A:5A:E9:BF:DC
Signature algorithm name: SHA256withRSA
Subject Public Key Algorithm: 2048-bit RSA key
Version: 3

Extensions:

#1: ObjectId: 2.5.29.35 Criticality=false
AuthorityKeyIdentifier [
KeyIdentifier [
0000: 16 84 4C D8 5C 85 03 97   6A E9 E3 07 0E 71 63 45  ..L.\...j....qcE
0010: DC 6D CD 83                                        .m..
]
]

#2: ObjectId: 2.5.29.19 Criticality=true
BasicConstraints:[
  CA:true
  PathLen:2147483647
]

#3: ObjectId: 2.5.29.14 Criticality=false
SubjectKeyIdentifier [
KeyIdentifier [
0000: 16 84 4C D8 5C 85 03 97   6A E9 E3 07 0E 71 63 45  ..L.\...j....qcE
0010: DC 6D CD 83                                        .m..
]
]
```

Dan ketika ditanya apakah akan mempercayai sertifikat tersebut, maka berikan input **yes**

```
Trust this certificate? [no]:  yes
Certificate was added to keystore
```

Sampai sini sudah selesai dan bisa dicoba lagi untuk melakukan test connection pada Jenkins. Semoga bermanfaat.
