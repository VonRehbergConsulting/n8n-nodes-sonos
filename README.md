# n8n-nodes-sonos

This is the repository for the n8n sonos node.

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
