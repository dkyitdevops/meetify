import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.GitSCM
import hudson.plugins.git.UserRemoteConfig
import hudson.plugins.git.BranchSpec

def jenkins = Jenkins.instance
def jobName = "meetify"

def job = jenkins.getItem(jobName)
if (job == null) {
    job = jenkins.createProject(WorkflowJob.class, jobName)
}

def userRemoteConfig = new UserRemoteConfig("https://github.com/dkyitdevops/meetify.git", null, null, null)
def branchSpec = new BranchSpec("*/main")
def scm = new GitSCM([userRemoteConfig], [branchSpec], null, null, [])

def flowDefinition = new CpsScmFlowDefinition(scm, "jenkins/Jenkinsfile")
job.setDefinition(flowDefinition)
job.save()

jenkins.reload()
println "Job '$jobName' created/updated successfully"