SHELL := bash
BUNDLE := ../bin/bundle
REF := references

IS_GIT_TREE := (which git && git ls-files --error-unmatch) >/dev/null 2>&1
IS_GIT_TREE := false

EXP_OK := || true
EXP_FAIL := || true
ifeq (no,$(shell $(IS_GIT_TREE) || echo no))
  EXP_OK := || exit 1
  EXP_FAIL := && exit 1 || true
endif

HR=echo "========================================================="
STARTING_STEP = @echo "STARTING STEP $@"

T = @function testcase {\
        local name=$$1; shift; \
        local retExp=$$1; shift; \
        echo "STARTING TEST $$name"; \
	ret=0; \
	( \
          set -x; \
          $$@ >references/$$name.res 2>&1 || ret=$$?; \
	  test $$ret = $$retExp $(EXP_OK); \
          diff -u references/$$name.res references/$$name.ref $(EXP_OK); \
          diff -u -r repo references/$$name $(EXP_OK); \
	); \
	echo "SUCCESSFULLY FINISHED TEST $$name"; echo ""; $(HR); \
    }; testcase


main: clitests

clitests: clean _clitest_init 

_clitest_init:
	$(T) clitest_init 0 $(BUNDLE) init bionic --no-clean-commit

clean:
	rm -Rf repo
	rm -f $(REF)/*.res
	@$(HR)

