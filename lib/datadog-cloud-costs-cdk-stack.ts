import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cur from 'aws-cdk-lib/aws-cur';

export interface DatadogCloudCostsCdkStackProps extends cdk.StackProps {
    DatadogIntegrationRole: string;
    s3Prefix: string;
    reportName: string;
    timeUnit: string;
    format: string;
    compression: string;
    additionalSchemaElements: string[];
    region: string;
}

export class DatadogCloudCostsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DatadogCloudCostsCdkStackProps) {
    super(scope, id, props);

    if (props.region !== 'us-east-1') {
        throw new Error('Datadog requires the report to be in us-east-1');
    }

    const s3Bucket = new s3.Bucket(this, 'DatadogCloudCostsCdkBucket', {
      bucketName: `${props.env?.account}-datadog-cloud-costs`,
    });

    const existingRole = iam.Role.fromRoleArn(this, 'DatadogRole', props.DatadogIntegrationRole);

    const datadog_data_export = new cur.CfnReportDefinition(this, 'Datadog_Cost_Usage_Report', {
        reportName: props.reportName,
        timeUnit: props.timeUnit,
        format: props.format,
        compression: props.compression,
        additionalSchemaElements: props.additionalSchemaElements,
        s3Bucket: s3Bucket.bucketName,
        s3Prefix: 'datadog-cloud-costs',
        s3Region: props.region,
        refreshClosedReports: true,
        additionalArtifacts: [],
        reportVersioning: 'CREATE_NEW_REPORT',
    });

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

    // Add a dependency on the policy to ensure it is created before the role
      datadog_data_export.node.addDependency(datadog_usage_policy);

    // Attach this policy to the existing role
    datadog_usage_policy.attachToRole(existingRole);
  }
}
