<h1 align=center>Disco-pod</h1>
<h3 align=center>A pod discovery sidecar for Kubernetes</h3>
<img align=center src="https://i.imgur.com/4en3yrg.png" />

This lib is **very** light (30 lines of simple javascript)

## Installation

It is intended to run as a sidecar of your app in a kubernetes pod, with zeromq

```sh
      containers:
        - name: disco-pod
          image: hydre/disco-pod
          imagePullPolicy: IfNotPresent
          tty: true
          env:
            - name: DEBUG
              value: disco-pod*
            - name: REQUEST_PORT
              value: {{ .Values.disco-pod.config.REQUEST_PORT }}
            - name: SUBSCRIBE_PORT
              value: {{ .Values.disco-pod.config.SUBSCRIBE_PORT }}
            - name: LABEL
              value: {{ .Values.disco-pod.config.ENDPOINT_NAME }}
```

- REQUEST_PORT: when your app boot you must zmq.request the pods ip lists through zeromq to `tcp://0.0.0.0:REQUEST_PORT`
- PUBLISH_PORT: here you can zmq.subscribe to receive updates when the peer list changes
- LABEL: Label of the targetted pod


You will receive ADDED / MODIFIED / DELETED peers update, note that ADDED might not always contains the ip
if the pod is started but not ready. You should maintain a Set of peers and when receiving an ip, add to this set or delete