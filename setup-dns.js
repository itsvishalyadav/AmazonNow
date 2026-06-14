import { Route53Client, CreateHostedZoneCommand, ChangeResourceRecordSetsCommand } from "@aws-sdk/client-route-53";

const client = new Route53Client({ region: "us-east-1" });

async function setupDNS() {
  const domainName = "amazonnow.tech";
  const callerReference = Date.now().toString();

  console.log(`Creating Hosted Zone for ${domainName}...`);
  const createHzCommand = new CreateHostedZoneCommand({
    Name: domainName,
    CallerReference: callerReference,
  });

  const hzResponse = await client.send(createHzCommand);
  const hzId = hzResponse.HostedZone.Id;
  const nameServers = hzResponse.DelegationSet.NameServers;

  console.log(`Hosted Zone Created! ID: ${hzId}`);
  console.log(`\n*** YOUR AWS NAMESERVERS ***`);
  nameServers.forEach(ns => console.log(ns));
  console.log(`****************************\n`);

  console.log("Configuring DNS Records...");
  const changeCommand = new ChangeResourceRecordSetsCommand({
    HostedZoneId: hzId,
    ChangeBatch: {
      Changes: [
        {
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: domainName,
            Type: "A",
            AliasTarget: {
              HostedZoneId: "Z2FDTNDATAQYW2", // Universal CloudFront Zone ID
              DNSName: "d2aqm8yvsfct8d.cloudfront.net.",
              EvaluateTargetHealth: false,
            },
          },
        },
        {
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: `www.${domainName}`,
            Type: "CNAME",
            TTL: 300,
            ResourceRecords: [{ Value: "d2aqm8yvsfct8d.cloudfront.net" }],
          },
        },
        {
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: "_c6a09ad4aa275b7e1618ee73aaaeec1f4.amazonnow.tech.",
            Type: "CNAME",
            TTL: 300,
            ResourceRecords: [{ Value: "_b36b3f40eb7ddc9ad741306d3b7c871e.jkddzztszm.acm-validations.aws." }],
          },
        }
      ],
    },
  });

  await client.send(changeCommand);
  console.log("Successfully created Root ALIAS, WWW CNAME, and ACM Validation CNAME records in AWS Route 53!");
}

setupDNS().catch(console.error);
