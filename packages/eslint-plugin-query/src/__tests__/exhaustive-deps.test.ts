import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/exhaustive-deps/exhaustive-deps.rule'
import { normalizeIndent } from './test-utils'

const ruleTester = new RuleTester()

ruleTester.run('exhaustive-deps', rule, {
  valid: [
    {
      name: 'should pass when deps are passed in array (react)',
      code: 'useQuery({ queryKey: ["todos"], queryFn: fetchTodos });',
    },
    {
      name: 'should pass when deps are passed in array (solid)',
      code: 'createQuery({ queryKey: ["todos"], queryFn: fetchTodos });',
    },
    {
      name: 'should pass when deps are passed in array',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should pass when deps are passed in template literal',
      code: 'useQuery({ queryKey: [`entity/${id}`], queryFn: () => api.getEntity(id) });',
    },
    {
      name: 'should not pass fetch',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => fetch(id) });',
    },
    {
      name: 'should not pass axios.get',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => axios.get(id) });',
    },
    {
      name: 'should not pass api.entity.get',
      code: 'useQuery({ queryKey: ["entity", id], queryFn: () => api.entity.get(id) });',
    },
    {
      name: 'should not pass api when is being used for calling a function',
      code: `
        import useApi from './useApi'

        const useFoo = () => {
          const api = useApi();
          return useQuery({
            queryKey: ['foo'],
            queryFn: () => api.fetchFoo(),
          })
        }
      `,
    },
    {
      name: 'should pass props.src',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props.src], queryFn: () => api.entity.get(props.src) });
        }
      `,
    },
    {
      name: 'identify !!props.id (unary expression)',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", !!props.id], queryFn: () => api.entity.get(props.id) });
        }
      `,
    },
    {
      name: 'identify props?.id (chain expression)',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props?.id], queryFn: () => api.entity.get(props?.id) });
        }
      `,
    },
    {
      name: 'identify props!.id (ts non null expression)',
      code: `
        function MyComponent(props) {
            useQuery({ queryKey: ["entity", props!.id], queryFn: () => api.entity.get(props!.id) });
        }
      `,
    },
    {
      name: 'should ignore keys from callback',
      code: `
        function MyComponent(props) {
            useQuery({
              queryKey: ["foo", dep1],
              queryFn: ({ queryKey: [, dep] }) => fetch(dep),
            });
        }
      `,
    },
    {
      name: 'should ignore type identifiers',
      code: `
        type Result = {};
        function MyComponent(props) {
            useQuery({
              queryKey: ["foo", dep],
              queryFn: () => api.get<Result>(dep),
            });
        }
      `,
    },
    {
      name: 'should add "...args" to deps',
      code: `
        function foo(...args) {}
        function useData(arg, ...args) {
          return useQuery({
            queryKey: ['foo', arg, ...args],
            queryFn: async () => foo([arg, ...args])
          });
        }
      `,
    },
    {
      name: 'should not add class to deps',
      code: `
        class Foo {}
        useQuery({ queryKey: ['foo'], queryFn: async () => new Foo() });
      `,
    },
    {
      name: 'should not add `undefined` to deps',
      code: `
        useQuery({
          queryKey: [],
          queryFn: async () => {
            if (undefined) {
              return null;
            }
            return 1
          },
        });
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep as first arg',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo(num),
            queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in object',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo({ x: num }),
            queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in object 2',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
            queryKey: fooQueryKeyFactory.foo({ num }),
            queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in array',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo([num]),
              queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep in second arg',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (num: number) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo(1, num),
              queryFn: () => Promise.resolve(num),
          })
      `,
    },
    {
      name: 'should not fail when queryKey is a queryKeyFactory while having a dep is object prop',
      code: normalizeIndent`
        const fooQueryKeyFactory = {
          foo: () => ['foo'] as const,
          num: (num: number) => [...fooQueryKeyFactory.foo(), num] as const,
        }

        const useFoo = (obj: { num: number }) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo(obj.num),
              queryFn: () => Promise.resolve(obj.num),
          })
      `,
    },
    {
      name: 'should not treat new Error as missing dependency',
      code: normalizeIndent`
        useQuery({
          queryKey: ['foo'],
          queryFn: () => Promise.reject(new Error('1')),
        })
      `,
    },
    {
      name: 'should see id when there is a const assertion',
      code: normalizeIndent`
        const useX = (id: number) => {
          return useQuery({
            queryKey: ['foo', id] as const,
            queryFn: async () => id,
          })
        }
      `,
    },
    {
      name: 'should not fail if queryKey is having the whole object while queryFn uses some props of it',
      code: normalizeIndent`
        const state = { foo: 'foo', bar: 'bar' }

        useQuery({
            queryKey: ['state', state],
            queryFn: () => Promise.resolve({ foo: state.foo, bar: state.bar })
        })
      `,
    },
    {
      name: 'should not fail if queryKey does not include an internal dependency',
      code: normalizeIndent`
        useQuery({
          queryKey: ["api"],
          queryFn: async () => {
            const response = Promise.resolve([]);
            const data = await response.json();
            return data[0].name;
          },
        });
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react component, function declaration)',
      code: `
        const CONST_VAL = 1
        function MyComponent() {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react component, function expression)',
      code: `
        const CONST_VAL = 1
        const MyComponent = () => {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react component, anonymous function)',
      code: `
        const CONST_VAL = 1
        const MyComponent = function () {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (non react component/hook function)',
      code: `
          const CONST_VAL = 1
          function fn() {
            return {
              queryKey: ["foo"],
              queryFn: () => CONST_VAL
            }
          }
        `,
    },
    {
      name: 'should ignore constants defined out of scope (react hook, function declaration)',
      code: `
        const CONST_VAL = 1
        function useHook() {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react hook, function expression)',
      code: `
        const CONST_VAL = 1
        const useHook = () => {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'should ignore constants defined out of scope (react hook, anonymous function)',
      code: `
        const CONST_VAL = 1
        const useHook = function () {
          useQuery({
            queryKey: ["foo"],
            queryFn: () => CONST_VAL
          });
        }
      `,
    },
    {
      name: 'query key with nullish coalescing operator',
      code: `
        const factory = (id: number) => ['foo', id];
        function Component({ id }) {
          useQuery({
            queryKey: factory(id ?? -1),
            queryFn: () => Promise.resolve({ id })
          });
        }
        `,
    },
    {
      name: 'instanceof value should not be in query key',
      code: `
        class SomeClass {}

        function Component({ value }) {
            useQuery({
                queryKey: ['foo'],
                queryFn: () => {
                    return value instanceof SomeClass;
                }
            });
        }
        `,
    },
    {
      name: 'queryFn as a ternary expression with dep and a skipToken',
      code: normalizeIndent`
        import { useQuery, skipToken } from "@tanstack/react-query";
        const fetch = true

        function Component({ id }) {
          useQuery({
              queryKey: [id],
              queryFn: fetch ? () => Promise.resolve(id) : skipToken
          })
        }
      `,
    },
    {
      name: 'should not fail when queryFn uses nullish coalescing operator',
      code: normalizeIndent`
        useQuery({
          queryKey: ["foo", options],
          queryFn: () => options?.params ?? options
        });
      `,
    },
    {
      name: 'should not fail when queryKey uses arrow function to produce a key',
      code: normalizeIndent`
      const obj = reactive<{ boo?: string }>({});

      const query = useQuery({
        queryKey: ['foo', () => obj.boo],
        queryFn: () => fetch(\`/mock/getSomething/\${obj.boo}\`),
        enable: () => !!obj.boo,
      });
      `,
    },
    {
      name: 'should not fail when queryKey uses arrow function to produce a key as the body return',
      code: normalizeIndent`
      const obj = reactive<{ boo?: string }>({});

      const query = useQuery({
        queryKey: ['foo', () => { return obj.boo }],
        queryFn: () => fetch(\`/mock/getSomething/\${obj.boo}\`),
        enable: () => !!obj.boo,
      });
      `,
    },
    {
      name: 'should not fail when queryKey uses function expression to produce a key as the body return',
      code: normalizeIndent`
      const obj = reactive<{ boo?: string }>({});

      const query = useQuery({
        queryKey: ['foo', function() {
          return obj.boo
        }],
        queryFn: () => fetch(\`/mock/getSomething/\${obj.boo}\`),
        enable: () => !!obj.boo,
      });
      `,
    },
    {
      name: 'should not fail when queryFn inside queryOptions contains a reference to an external variable',
      code: normalizeIndent`
      const EXTERNAL = 1;

      export const queries = {
        foo: queryOptions({
          queryKey: ['foo'],
          queryFn: () => Promise.resolve(EXTERNAL),
        }),
      };
      `,
    },
    {
      name: 'should pass with optional chaining as key',
      code: `
        function useTest(data?: any) {
          return useQuery({
            queryKey: ['query-name', data?.address],
            queryFn: async () => sendQuery(data.address),
            enabled: !!data?.address,
          })
        }
      `,
    },
    {
      name: 'should pass with optional chaining as key and non-null assertion in queryFn',
      code: `
        function useTest(data?: any) {
          return useQuery({
            queryKey: ['query-name', data?.address],
            queryFn: async () => sendQuery(data!.address),
            enabled: !!data?.address,
          })
        }
      `,
    },
    {
      name: 'should pass with optional chaining as key and non-null assertion at the end of the variable in queryFn',
      code: `
        function useTest(data?: any) {
          return useQuery({
            queryKey: ['query-name', data?.address],
            queryFn: async () => sendQuery(data!.address!),
            enabled: !!data?.address,
          })
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should fail when deps are missing in query factory',
      code: normalizeIndent`
        const todoQueries = {
          list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
          detail: (id) => ({ queryKey: ['entity'], queryFn: () => fetchEntity(id) })
        }
        `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: "['entity', id]" },
              output: normalizeIndent`
                const todoQueries = {
                  list: () => ({ queryKey: ['entity'], queryFn: fetchEntities }),
                  detail: (id) => ({ queryKey: ['entity', id], queryFn: () => fetchEntity(id) })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when no deps are passed (react)',
      code: normalizeIndent`
        function Component() {
          const id = 1;
          useQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", id]' },
              output: normalizeIndent`
                function Component() {
                  const id = 1;
                  useQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when no deps are passed (solid)',
      code: normalizeIndent`
        function Component() {
          const id = 1;
          createQuery({ queryKey: ["entity"], queryFn: () => api.getEntity(id) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", id]' },
              output: normalizeIndent`
                function Component() {
                  const id = 1;
                  createQuery({ queryKey: ["entity", id], queryFn: () => api.getEntity(id) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when deps are passed incorrectly',
      code: normalizeIndent`
        function Component() {
          const id = 1;
          useQuery({ queryKey: ["entity/\${id}"], queryFn: () => api.getEntity(id) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity/${id}", id]' },
              output: normalizeIndent`
                function Component() {
                  const id = 1;
                  useQuery({ queryKey: ["entity/\${id}", id], queryFn: () => api.getEntity(id) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should pass missing dep while key has a template literal',
      code: normalizeIndent`
        function Component() {
          const a = 1;
          const b = 2;
          useQuery({ queryKey: [\`entity/\${a}\`], queryFn: () => api.getEntity(a, b) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'b' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '[`entity/${a}`, b]' },
              output: normalizeIndent`
                function Component() {
                  const a = 1;
                  const b = 2;
                  useQuery({ queryKey: [\`entity/\${a}\`, b], queryFn: () => api.getEntity(a, b) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep exists inside setter and missing in queryKey',
      code: normalizeIndent`
        function Component() {
          const [id] = React.useState(1);
          useQuery({
            queryKey: ["entity"],
            queryFn: () => {
              const { data } = axios.get(\`.../\${id}\`);
              return data;
            }
          });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'id' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", id]' },
              output: normalizeIndent`
                function Component() {
                  const [id] = React.useState(1);
                  useQuery({
                    queryKey: ["entity", id],
                    queryFn: () => {
                      const { data } = axios.get(\`.../\${id}\`);
                      return data;
                    }
                  });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep does not exist while having a complex queryKey',
      code: normalizeIndent`
        const todoQueries = {
          key: (a, b, c, d, e) => ({
            queryKey: ["entity", a, [b], { c }, 1, true],
            queryFn: () => api.getEntity(a, b, c, d, e)
          })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'd, e' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: { result: '["entity", a, [b], { c }, 1, true, d, e]' },
              output: normalizeIndent`
                const todoQueries = {
                  key: (a, b, c, d, e) => ({
                    queryKey: ["entity", a, [b], { c }, 1, true, d, e],
                    queryFn: () => api.getEntity(a, b, c, d, e)
                  })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when dep does not exist while having a complex queryKey #2',
      code: normalizeIndent`
        const todoQueries = {
          key: (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8) => ({
            queryKey: ['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7]],
            queryFn: () => api.getEntity(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8),
          }),
        };
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'dep8' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: {
                result:
                  "['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7], dep8]",
              },
              output: normalizeIndent`
                const todoQueries = {
                  key: (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8) => ({
                    queryKey: ['foo', {dep1, dep2: dep2, bar: dep3, baz: [dep4, dep5]}, [dep6, dep7], dep8],
                    queryFn: () => api.getEntity(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8),
                  }),
                };
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when two deps that depend on each other are missing',
      code: normalizeIndent`
        function Component({ map, key }) {
          useQuery({ queryKey: ["key"], queryFn: () => api.get(map[key]) });
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'map[key]' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: {
                result: '["key", map[key]]',
              },
              output: normalizeIndent`
                function Component({ map, key }) {
                  useQuery({ queryKey: ["key", map[key]], queryFn: () => api.get(map[key]) });
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when a queryKey is a reference of an array expression with a missing dep',
      code: normalizeIndent`
        function Component() {
          const x = 5;
          const queryKey = ['foo']
          useQuery({ queryKey, queryFn: () => x })
        }
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'x' },
          suggestions: [
            {
              messageId: 'fixTo',
              data: {
                result: "['foo', x]",
              },
              output: normalizeIndent`
                function Component() {
                  const x = 5;
                  const queryKey = ['foo', x]
                  useQuery({ queryKey, queryFn: () => x })
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'should fail when queryKey is a queryKeyFactory while having missing dep',
      code: normalizeIndent`
        const fooQueryKeyFactory = { foo: () => ['foo'] as const }

        const useFoo = (num: number) =>
          useQuery({
              queryKey: fooQueryKeyFactory.foo(),
              queryFn: () => Promise.resolve(num),
          })
      `,
      errors: [
        {
          messageId: 'missingDeps',
          data: { deps: 'num' },
        },
      ],
    },
    {
      name: 'should fail if queryFn is using multiple object props when only one of them is in the queryKey',
      code: normalizeIndent`
        function Component() {
          const state = { foo: 'foo', bar: 'bar' }

          useQuery({
            queryKey: ['state', state.foo],
            queryFn: () => Promise.resolve({ foo: state.foo, bar: state.bar })
          })
        }
      `,
      errors: [
        {
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
              function Component() {
                const state = { foo: 'foo', bar: 'bar' }

                useQuery({
                  queryKey: ['state', state.foo, state.bar],
                  queryFn: () => Promise.resolve({ foo: state.foo, bar: state.bar })
                })
              }
            `,
            },
          ],
          messageId: 'missingDeps',
          data: { deps: 'state.bar' },
        },
      ],
    },
    {
      name: 'should fail if queryFn is invalid while using FunctionExpression syntax',
      code: normalizeIndent`
        function Component() {
          const id = 1;

          useQuery({
            queryKey: [],
            queryFn() {
              Promise.resolve(id)
            }
          });
        }
      `,
      errors: [
        {
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                function Component() {
                  const id = 1;

                  useQuery({
                    queryKey: [id],
                    queryFn() {
                      Promise.resolve(id)
                    }
                  });
                }
              `,
            },
          ],
          messageId: 'missingDeps',
          data: { deps: 'id' },
        },
      ],
    },
    {
      name: 'should fail if queryFn is a ternary expression with missing dep and a skipToken',
      code: normalizeIndent`
        import { useQuery, skipToken } from "@tanstack/react-query";
        const fetch = true

        function Component({ id }) {
          useQuery({
              queryKey: [],
              queryFn: fetch ? () => Promise.resolve(id) : skipToken
          })
        }
      `,
      errors: [
        {
          suggestions: [
            {
              messageId: 'fixTo',
              output: normalizeIndent`
                import { useQuery, skipToken } from "@tanstack/react-query";
                const fetch = true

                function Component({ id }) {
                  useQuery({
                      queryKey: [id],
                      queryFn: fetch ? () => Promise.resolve(id) : skipToken
                  })
                }
              `,
            },
          ],
          messageId: 'missingDeps',
          data: { deps: 'id' },
        },
      ],
    },
  ],
})
