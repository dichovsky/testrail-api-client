import { AddResultPayloadSchema, AddResultsForCasesPayloadSchema, AddResultsPayloadSchema } from '../../schemas.js';
import { createWriteHandler } from '../write-handler-factory.js';

export const handleResultAddByTest = createWriteHandler({
    action: 'result add-by-test',
    pathParams: ['test_id'],
    bodySchema: AddResultPayloadSchema,
    call: (client, [testId], body) => client.results.addResult(testId, body),
});

export const handleResultAdd = createWriteHandler({
    action: 'result add',
    pathParams: ['run_id', 'case_id'],
    bodySchema: AddResultPayloadSchema,
    call: (client, [runId, caseId], body) => client.results.addResultForCase(runId, caseId, body),
});

export const handleResultAddBulk = createWriteHandler({
    action: 'result add-bulk',
    pathParams: ['run_id'],
    bodySchema: AddResultsForCasesPayloadSchema,
    call: (client, [runId], body) => client.results.addResultsForCases(runId, body),
});

export const handleResultAddBulkByTest = createWriteHandler({
    action: 'result add-bulk-by-test',
    pathParams: ['run_id'],
    bodySchema: AddResultsPayloadSchema,
    call: (client, [runId], body) => client.results.addResults(runId, body),
});
