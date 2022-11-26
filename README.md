![workflow](https://user-images.githubusercontent.com/8611608/204108531-22228164-e07b-41d0-a965-63f4cc55777d.png)

# n8n-nodes-sonos

This is the repository for the n8n sonos node.

## Setup

In order to use the Sonos node, you have to create a Sonos Developer Account and create a new Control Integration. The created credentials will be required for the creation of the n8n credential.
![using-oauth](https://user-images.githubusercontent.com/8611608/204108609-140d3c9d-46a5-4009-bf88-275c711b45fe.gif)

## Running locally

First install n8n globally
```bash
npm install n8n -g
```

Then build and link this library:
```bash
npm run build
npm link
```

Afterwards find out where n8n was installed
```bash
which n8n
```

Go to the folder that is listed and type:
```bash
npm link n8n-nodes-sonos
n8n start
```

Afterwards you can use the node in your locally running instance

## License

[MIT](https://github.com/VonRehbergConsulting/n8n-nodes-sonos/blob/master/LICENSE.md)
