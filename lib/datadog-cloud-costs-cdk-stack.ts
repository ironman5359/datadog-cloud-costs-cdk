import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface DatadogCloudCostsCdkStackProps extends cdk.StackProps {
  DatadogIntegrationRole: string;
  s3Prefix: string
  reportName: string
}

export class DatadogCloudCostsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DatadogCloudCostsCdkStackProps) {
    super(scope, id, props);

    const s3Bucket = new s3.Bucket(this, 'DatadogCloudCostsCdkBucket', {
      bucketName: `${props.env?.account}-datadog-cloud-costs`,
    });

    s3Bucket.addToResourcePolicy(new iam.PolicyStatement({
        sid: "EnableAWSDataExportsToWriteToS3AndCheckPolicy",
        effect: iam.Effect.ALLOW,
        principals: [
            new iam.ServicePrincipal('billingreports.amazonaws.com'),
            new iam.ServicePrincipal('bcm-data-exports.amazonaws.com')
        ],
        actions: [
            's3:PutObject',
            's3:GetBucketPolicy'
        ],
        resources: [
            `${s3Bucket.bucketArn}`,
            `${s3Bucket.bucketArn}/*`
        ],
        conditions: {
            stringlike: {
                "aws:SourceAccount": `${props.env?.account}`,
                "aws:SourceArn": [
                  `arn:aws:cur:us-east-1:${props.env?.account}:definition/*`,
                  `arn:aws:bcm-data-exports:us-east-1:${props.env?.account}:export/*`
                 ]
            }
        }
    }));

    const cfnReportDefinition = new cdk.aws_cur.CfnReportDefinition(this, 'DatadogCloudCostsCdkReportDefinition', {
        format: 'textORcsv',
        s3Bucket: s3Bucket.bucketName,
        compression: 'GZIP',
        s3Region: 'us-east-1',
        timeUnit: 'HOURLY',
        reportVersioning: 'CREATE_NEW_REPORT',
        additionalSchemaElements: ['RESOURCES', 'SPLIT_COST_ALLOCATION_DATA', 'MANUAL_DISCOUNT_COMPATIBILITY'],
        reportName: props.reportName,
        refreshClosedReports: true,
        s3Prefix: props.s3Prefix,
    });

    const existingRole = iam.Role.fromRoleArn(this, 'DatadogRole', props.DatadogIntegrationRole);

    const datadog_usage_policy = new iam.Policy(this, 'Datadog_Cost_Usage_Policy', {
      policyName: 'Datadog_Cost_and_Usage_Policy',
      statements: [
        new iam.PolicyStatement({
            sid: 'DDCloudCostReadBucket',
            actions: ['s3:ListBucket'],
            effect: iam.Effect.ALLOW,
            resources: [s3Bucket.bucketArn],
        }),
        new iam.PolicyStatement({
            sid: 'DDCloudCostGetBill',
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject'],
            resources: [`${s3Bucket.bucketArn}/${props.s3Prefix}/${props.reportName}/*`],
        }),
        new iam.PolicyStatement({
            sid: 'DDCloudCostCheckAccuracy',
            effect: iam.Effect.ALLOW,
            actions: ['ce:Get*'],
            resources: ["*"]
        }),
        new iam.PolicyStatement({
            sid: 'DDCloudCostListCURs',
            effect: iam.Effect.ALLOW,
            actions: ['cur:DescribeReportDefinitions'],
            resources: ["*"]
        }),
        new iam.PolicyStatement({
            sid: 'DDCloudCostListOrganizations',
            effect: iam.Effect.ALLOW,
            actions: [
              "organizations:Describe*",
              "organizations:List*"
            ],
            resources: ["*"]
        }),
      ]
    });

    // Attach this policy to the existing role
    datadog_usage_policy.attachToRole(existingRole);
  }
}
