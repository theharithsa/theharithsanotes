"""Run the actual unittest suite and retain a bounded machine-readable report."""
from pathlib import Path
import time
import unittest
import xml.etree.ElementTree as ET

class ReportResult(unittest.TextTestResult):
    def startTest(self, test):
        self.started = time.monotonic()
        self.outcome = "success"
        super().startTest(test)

    def addFailure(self, test, err):
        self.outcome = "failure"
        super().addFailure(test, err)

    def addError(self, test, err):
        self.outcome = "error"
        super().addError(test, err)

    def addSkip(self, test, reason):
        self.outcome = "skipped"
        super().addSkip(test, reason)

    def addExpectedFailure(self, test, err):
        self.outcome = "skipped"
        super().addExpectedFailure(test, err)

    def addUnexpectedSuccess(self, test):
        self.outcome = "failure"
        super().addUnexpectedSuccess(test)

    def stopTest(self, test):
        case = ET.SubElement(report, "testcase", {"name": test.id(), "time": str(time.monotonic() - self.started)})
        if self.outcome != "success":
            ET.SubElement(case, self.outcome)
        super().stopTest(test)

report = ET.Element("testsuite", {"name": "foundation"})
suite = unittest.defaultTestLoader.discover("tests")
result = unittest.TextTestRunner(verbosity=2, resultclass=ReportResult).run(suite)
Path("artifacts").mkdir(exist_ok=True)
ET.ElementTree(report).write("artifacts/foundation-tests.xml", encoding="utf-8", xml_declaration=True)
raise SystemExit(0 if result.wasSuccessful() else 1)
