# lti-advantage-tool

A test harness which implements an IMS LTI Advantage tool

## Initial setup

Generate a TLS key-pair by running the following command. You will need to add
the public key to your platform's trusted key store.

```sh
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

### config.json

Create a config.json file with the following details.

```json
{
    "platform_configs": [
        {
            "client_id": "<client id>",
            "audience": "<auth service required audience>",
            "issuer": "<platform issuer value>",
            "authenticate_uri": "<platform authenticate uri>",
            "public_key_uri": "<platform public key uri>",
            "token_uri": "<auth service token uri>"
        }
    ]
}
```
