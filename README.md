

## Payspec Bot

This bot will have an internal mongo database with
  1) Pre-Invoices  (perpared invoices, not yet committed to the blockchain )
  2) A list of deployed invoices by UUID


Will serve an express website with:

1) A customer-facing portal with
  * a 'show invoices' page that serves the invoice data from the mongo database

2) An admin backend (requires console-generated password)  with
  * a list of all invoices cached from mongo, searchable


3) a local API
  * can generate and store a pre-invoice and provide the 'show invoice' page URL
  * can retrieve data from the ethereum blockchain related to the invoices state on-chain


# INSTALL
-NodeJS (npm install 8.16)
-MongoDB (https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)


# CONFIG

1) Duplicate sample.secrets.config.js to secrets.config.js and populate it properly

2) npm run webpack

3) npm run server
