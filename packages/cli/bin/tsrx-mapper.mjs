#!/usr/bin/env node
import { create_tsrx_content_mapper } from '@tsrx/content-mapper/mapper'
import { redirect_console_to_stderr, run_mapper_server } from '@tsrx/content-mapper/rpc'

redirect_console_to_stderr()
run_mapper_server(create_tsrx_content_mapper())
