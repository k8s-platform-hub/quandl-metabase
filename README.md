# quandl-metabase

This quickstart, for the most part, consists of two microservices:

1. quandl: Fetches and stores data from [Quandl](https://www.quandl.com/) and stores them in Hasura

2. metabase: Runs [Metabase](https://www.metabase.com/) on this service which can be used to visualise the data fetched from quandl

Follow along below to get the setup working on your cluster and also to understand how this quickstart works.

## Prerequisites

* Ensure that you have the [hasura cli](https://docs.hasura.io/0.15/manual/install-hasura-cli.html) tool installed on your system.

```sh
$ hasura version
```

Once you have installed the hasura cli tool, login to your Hasura account

```sh
$ # Login if you haven't already
$ hasura login
```

* You should have [Node.js](https://nodejs.org/en/) installed on your system, you can check this by:

```sh
# To check the version of node installed
$ node -v

# Node comes with npm. To check the version of npm installed
$ npm -v
```

* You should also have [git](https://git-scm.com) installed.

```sh
$ git --version
```

## Getting started

```sh
$ # Run the quickstart command to get the project
$ hasura quickstart hasura/quandl-metabase

$ # Navigate into the Project
$ cd quandl-metabase
```

## Quandl

Before you begin, head over to [Quandl](https://www.quandl.com/) and select the dataset you would like to use. In this case, we are going with the `Wiki EOD Stock Prices` dataset. Keep in mind the `Vendor Code` (In this case it is, `WIKI`) and `Datatable Code` (`PRICES` in this case) for the dataset.

![Quandl 1](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/quandl1.png "Quandl 1")

![Quandl 3](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/quandl3.png "Quandl 3")


To fetch the data you need to have an `API Key` which you can get by getting an account with Quandl.

![Quandl 2](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/quandl2.png "Quandl 2")

Keep a note of your `API Key`.

### Adding the Quandl `API Key` to Hasura secrets

Sensitive data like API keys, tokens etc should be stored in Hasura secrets and then accessed as an environment variable in your app. Do the following to add your Quandl API Key to Hasura secrets.

```sh
$ # Paste the following into your terminal
$ # Replace <API-KEY> with the API Key you got from Quandl
$ hasura secret update quandl.api.key <API-KEY>
```

This value is injected as an environment variable (QUANDL_API_KEY) to the quandl service like so:

```yaml
env:
- name: QUANDL_API_KEY
  valueFrom:
  secretKeyRef:
    key: quandl.api.key
    name: hasura-secrets
```

Check your `k8s.yaml` file inside `microservices/quandl/app` to check out the whole file.

Next, let's deploy the app onto your cluster.

## Deploy app

`Note: Deploy will not work if you have not followed the previous steps correctly`

```sh
$ # Ensure that you are in the quandl-metabase directory
$ # Git add, commit & push to deploy to your cluster
$ git add .
$ git commit -m 'First commit'
$ git push hasura master
```

Once the above commands complete successfully, your cluster will have two services `metabase` and `quandl` running. To get their URLs

```sh
$ # Run this in the quandl-metabase directory
$ hasura microservice list
```

```sh
• Getting microservices...
• Custom microservices:
NAME       STATUS    INTERNAL-URL       EXTERNAL-URL
metabase   Running   metabase.default   http://metabase.boomerang68.hasura-app.io
quandl     Running   quandl.default     http://quandl.boomerang68.hasura-app.io

• Hasura microservices:
NAME            STATUS    INTERNAL-URL           EXTERNAL-URL
auth            Running   auth.hasura            http://auth.boomerang68.hasura-app.io
data            Running   data.hasura            http://data.boomerang68.hasura-app.io
filestore       Running   filestore.hasura       http://filestore.boomerang68.hasura-app.io
gateway         Running   gateway.hasura
le-agent        Running   le-agent.hasura
notify          Running   notify.hasura          http://notify.boomerang68.hasura-app.io
platform-sync   Running   platform-sync.hasura
postgres        Running   postgres.hasura
session-redis   Running   session-redis.hasura
sshd            Running   sshd.hasura
```

You can access the services at the `EXTERNAL-URL` for the respective service.

## Exploring the data

Currently our database has not gotten any data from quandl. You can head over to your `api console` to check this out. It will have one table called `quandl_checkpoint` which stores the current offset at which the data in Hasura is stored.

```sh
$ # Run this in the quandl-metabase directory
$ hasura api-console
```

![Console Data 1](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/console_data_initial.png "Console Data 1")

Let's use our `quandl` service to insert some data. To do this:

```
POST https://quandl.<CLUSTER-NAME>.hasura-app.io/add_data // remember to replace <CLUSTER-NAME> with your own cluster name (In this case, http://quandl.boomerang68.hasura-app.io/add_data)

{
    "vendor_code": "WIKI",
    "datatable_code": "PRICES"
}
```

You can use a HTTP client of your choosing to make this request. Alternatively, you can also use the `API Explorer` provided by the Hasura `api console` to do this.

![Console Data 2](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/console_api_explorer_quandl_api.png "Console Data 2")

Once you have successfully made the above API call. Head back to your `api console` and you will see a new table called `wiki_prices` with about 10000 rows of data in it.

![Console Data 3](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/console_data_wiki_prices.png "Console Data 3")

## Visualising the data using Metabase

### Navigate to Metabase

Head over to the EXTERNAL-URL of your `metabase` service.

![Metabase 1](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_welcome.png "Metabase 1")

### SignUp

Enter your details. Click on `Add my data later` in Step 2 and complete the sign up process

![Metabase 2](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_signup.png "Metabase 2")

### Metabase Dashboard

You will now reach your `Dashboard`

![Metabase 3](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_home.png "Metabase 3")

### Connecting Hasura's database to Metabase

Now, let's connect our Hasura database to `metabase`

![Metabase 4](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_add_database.png "Metabase 4")

To get your `Database password`, go to your terminal:

```sh
$ # Run this in the quandl-metabase directory
$ hasura secret list
```

In the list that comes up, the value for `postgres.password` is your `Database password`. Paste this in the form and click on `Save`.

If everything goes well, you will see the following

![Metabase 5](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_database_added.png "Metabase 5")

### Visualising the data

Click on `New question` and select `Custom`

![Metabase 6](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_new_question.png "Metabase 6")

In the `Data` dropdown, select `hasuradb` `Public` and then search for `wiki_prices`

![Metabase 7](https://raw.githubusercontent.com/hasura/quandl-metabase/master/assets/metabase_new_question2.png "Metabase 7")

And that's it!





